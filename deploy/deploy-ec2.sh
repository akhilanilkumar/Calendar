#!/usr/bin/env bash
# ==============================================================================
# Schedulify AWS EC2 Auto-Deployment Script
# ==============================================================================

set -e

REGION="${AWS_REGION:-us-east-1}"
SECURITY_GROUP_NAME="schedulify-sg"
KEY_NAME="${AWS_KEY_NAME:-schedulify-key}"
INSTANCE_TYPE="t3.micro"

echo "========================================================"
echo "  🚀 Schedulify AWS EC2 Deployment Assistant"
echo "  Region: $REGION"
echo "========================================================"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed."
    exit 1
fi

# Check AWS Credentials
echo "🔍 Checking AWS credentials..."
CALLER_ID=$(aws sts get-caller-identity --output json 2>&1 || true)
if [[ $CALLER_ID == *"Arn"* ]]; then
    ACCOUNT_ID=$(echo "$CALLER_ID" | grep -o '"Account": "[^"]*' | cut -d'"' -f4)
    echo "✓ Connected to AWS Account: $ACCOUNT_ID"
else
    echo "❌ AWS credentials error. Please run 'aws configure'."
    exit 1
fi

# 1. Create or Verify Security Group
echo "🛡️  Checking Security Group '$SECURITY_GROUP_NAME'..."
VPC_ID=$(aws ec2 describe-vpcs --region "$REGION" --query "Vpcs[0].VpcId" --output text)

SG_ID=$(aws ec2 describe-security-groups --region "$REGION" --group-names "$SECURITY_GROUP_NAME" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || true)

if [ -z "$SG_ID" ] || [ "$SG_ID" == "None" ]; then
    echo "Creating Security Group '$SECURITY_GROUP_NAME' in VPC $VPC_ID..."
    SG_ID=$(aws ec2 create-security-group \
        --group-name "$SECURITY_GROUP_NAME" \
        --description "Security group for Schedulify Booking App" \
        --vpc-id "$VPC_ID" \
        --region "$REGION" \
        --query "GroupId" --output text)

    echo "Authorizing inbound traffic on ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001..."
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0 --region "$REGION"
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$REGION"
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$REGION"
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 3001 --cidr 0.0.0.0/0 --region "$REGION"
    echo "✓ Security Group created: $SG_ID"
else
    echo "✓ Security Group exists: $SG_ID"
fi

echo ""
echo "Choose deployment option:"
echo "  1) Launch a NEW EC2 instance automatically & deploy Schedulify"
echo "  2) Deploy to an EXISTING EC2 instance via SSH"
read -p "Select option [1-2]: " CHOICE

if [ "$CHOICE" == "1" ]; then
    echo ""
    echo "🚀 Provisioning NEW EC2 Instance..."
    
    # Check or Create Key Pair
    KEY_EXISTS=$(aws ec2 describe-key-pairs --region "$REGION" --key-names "$KEY_NAME" --query "KeyPairs[0].KeyName" --output text 2>/dev/null || true)
    if [ -z "$KEY_EXISTS" ] || [ "$KEY_EXISTS" == "None" ]; then
        echo "Creating AWS Key Pair '$KEY_NAME'..."
        aws ec2 create-key-pair --key-name "$KEY_NAME" --region "$REGION" --query "KeyMaterial" --output text > "${KEY_NAME}.pem"
        chmod 400 "${KEY_NAME}.pem"
        echo "✓ Saved key to ./${KEY_NAME}.pem"
    else
        echo "✓ Key pair '$KEY_NAME' already exists in AWS."
    fi

    # Find latest Amazon Linux 2023 AMI
    AMI_ID=$(aws ec2 describe-images \
        --region "$REGION" \
        --owners amazon \
        --filters "Name=name,Values=al2023-ami-2023*-kernel-6.1-x86_64" "Name=state,Values=available" \
        --query "sort_by(Images, &CreationDate)[-1].ImageId" \
        --output text)

    echo "Using AMI: $AMI_ID"
    echo "Launching instance ($INSTANCE_TYPE)..."

    # User Data script to install Docker & Docker Compose automatically
    USER_DATA=$(cat <<'EOF'
#!/bin/bash
dnf update -y
dnf install -y docker git
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
EOF
    )

    USER_DATA_BASE64=$(echo "$USER_DATA" | base64)

    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id "$AMI_ID" \
        --count 1 \
        --instance-type "$INSTANCE_TYPE" \
        --key-name "$KEY_NAME" \
        --security-group-ids "$SG_ID" \
        --user-data "$USER_DATA" \
        --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Schedulify-Server}]' \
        --region "$REGION" \
        --query "Instances[0].InstanceId" --output text)

    echo "✓ EC2 Instance launched: $INSTANCE_ID"
    echo "Waiting for instance to receive Public IP..."
    aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"

    PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --region "$REGION" --query "Reservations[0].Instances[0].PublicIpAddress" --output text)

    echo ""
    echo "========================================================"
    echo "🎉 EC2 Instance is RUNNING!"
    echo "   Public IP:  $PUBLIC_IP"
    echo "   Instance:   $INSTANCE_ID"
    echo "   SSH Key:    ./${KEY_NAME}.pem"
    echo "========================================================"
    echo ""
    echo "To deploy the application code to your new EC2 instance:"
    echo "1. Wait 60 seconds for Docker installation script to complete."
    echo "2. Run this command to sync and deploy:"
    echo ""
    echo "   rsync -avz -e 'ssh -i ./${KEY_NAME}.pem -o StrictHostKeyChecking=no' --exclude 'node_modules' --exclude '.git' --exclude 'dist' ./ ec2-user@${PUBLIC_IP}:~/app/"
    echo "   ssh -i ./${KEY_NAME}.pem ec2-user@${PUBLIC_IP} 'cd ~/app && sudo docker compose -f deploy/docker-compose.prod.yml up -d --build'"
    echo ""
    echo "   Your app will be live at: http://${PUBLIC_IP}/"
    echo "========================================================"

elif [ "$CHOICE" == "2" ]; then
    read -p "Enter EC2 Public IP address: " PUBLIC_IP
    read -p "Enter SSH Key Path (e.g. ./my-key.pem): " KEY_PATH
    read -p "Enter SSH User (default: ec2-user or ubuntu): " SSH_USER
    SSH_USER=${SSH_USER:-ec2-user}

    echo "Syncing repository files to $SSH_USER@$PUBLIC_IP..."
    rsync -avz -e "ssh -i $KEY_PATH -o StrictHostKeyChecking=no" \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'dist' \
        --exclude 'server/*.db*' \
        ./ "$SSH_USER@$PUBLIC_IP:~/app/"

    echo "Building and starting Docker container on EC2..."
    ssh -i "$KEY_PATH" "$SSH_USER@$PUBLIC_IP" "cd ~/app && sudo docker compose -f deploy/docker-compose.prod.yml up -d --build"

    echo ""
    echo "========================================================"
    echo "🎉 Deployment successful!"
    echo "   Live URL: http://${PUBLIC_IP}/"
    echo "========================================================"
fi
