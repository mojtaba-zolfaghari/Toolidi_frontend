#!/usr/bin/env python3
"""
FTP Deployment Script - Uses active mode to avoid firewall issues
"""
import os
import sys
import ftplib
from pathlib import Path

def main():
    server = os.environ.get('FTP_SERVER')
    username = os.environ.get('FTP_USERNAME')
    password = os.environ.get('FTP_PASSWORD')
    local_dir = os.environ.get('LOCAL_DIR', './dist')
    remote_dir = os.environ.get('REMOTE_DIR', '/home/ftpuser/toolidi/')
    
    if not all([server, username, password]):
        print("Error: Missing FTP credentials")
        sys.exit(1)
    
    print(f"Connecting to {server}...")
    try:
        ftp = ftplib.FTP(server)
        ftp.login(username, password)
        ftp.set_pasv(False)  # Active mode
        print("Using active mode")
        
        # Create remote directory if it doesn't exist
        print(f"Creating remote directory: {remote_dir}")
        create_directory_recursive(ftp, remote_dir)
        
        # Change to remote directory
        ftp.cwd(remote_dir)
        print(f"Changed to: {remote_dir}")
        
        # Upload files
        local_path = Path(local_dir)
        uploaded = 0
        
        for filepath in local_path.rglob('*'):
            if filepath.is_file():
                rel_path = str(filepath.relative_to(local_path))
                remote_path = remote_dir.rstrip('/') + '/' + rel_path
                
                print(f"Uploading: {rel_path}")
                
                # Create subdirectories if needed
                remote_parent = os.path.dirname(remote_path)
                try:
                    ftp.cwd(remote_parent)
                except ftplib.error_perm:
                    create_directory_recursive(ftp, remote_parent)
                    ftp.cwd(remote_parent)
                
                # Upload file
                with open(filepath, 'rb') as f:
                    ftp.storbinary(f'STOR {os.path.basename(remote_path)}', f)
                uploaded += 1
        
        print(f"\n✅ Successfully uploaded {uploaded} files")
        ftp.quit()
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def create_directory_recursive(ftp, path):
    """Create directory and all parent directories recursively"""
    parts = path.strip('/').split('/')
    current = ''
    for part in parts:
        current += '/' + part
        try:
            ftp.cwd(current)
        except ftplib.error_perm:
            try:
                ftp.mkd(part)
                ftp.cwd(current)
            except Exception as e:
                print(f"Warning: Could not create {current}: {e}")

if __name__ == '__main__':
    main()