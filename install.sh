set -e

echo "Creating virtual environment..."
python3 -m venv venv

echo "Activating virtual envrionment..."
source venv/bin/activate

echo "Upgrading pip..."
pip install --upgrade pip

echo "Installing requried packages from requirements.txt.."
pip install -r requirements.txt

echo "Setup Complete!"

