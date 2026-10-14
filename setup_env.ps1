$env:Path += ";C:\Program Files\Amazon\AWSCLIV2;C:\Users\User\AppData\Local\Microsoft\WinGet\Packages\Hashicorp.Terraform_Microsoft.Winget.Source_8wekyb3d8bbwe"

Write-Host "AWS CLI and Terraform are now active in this session!" -ForegroundColor Green
aws --version
terraform --version
