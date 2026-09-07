#!/usr/bin/env python3
"""
FTP Deployment Script - Uses active mode to avoid firewall issues
"""
import sys
import os
import ftplib
import zipfile
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
        # Create FTP connection
        ftp = ftplib.FTP(server)
        ftp.login(username, password)
        
        # Set active mode (default is false for active, true for passive)
        ftp.set_pasv(False)
        print("Using active mode (PASV disabled)")
        
        # Change to remote directory
        ftp.cwd(remote_dir)
        print(f"Changed to remote directory: {remote_dir}")
        
        # Upload files
        local_path = Path(local_dir)
        uploaded = 0
        
        for filepath in local_path.rglob('*'):
            if filepath.is_file():
                # Skip dist folder in source
                if '/dist/' in str(filepath) and 'toolidi' not in str(filepath):
                    continue
                
                # Get relative path
                rel_path = str(filepath.relative_to(local_path))
                remote_path = remote_dir.rstrip('/') + '/' + rel_path
                
                print(f"Uploading: {rel_path}")
                
                # Create remote directory if needed
                remote_parent = os.path.dirname(remote_path)
                try:
                    ftp.cwd(remote_parent)
                except ftplib.error_perm:
                    # Create parent directories
                    dirs = remote_parent.replace(remote_dir, '').split('/')
                    current = remote_dir
                    for d in dirs:
                        if d:
                            current = current.rstrip('/') + '/' + d
                            try:
                                ftp.mkd(d)
                                ftp.cwd(d)
                            except:
                                pass
                    
                # Upload file
                with open(filepath, 'rb') as f:
                    ftp.storbinary(f'STOR {remote_path}', f)
                uploaded += 1
        
        print(f"\nSuccessfully uploaded {uploaded} files")
        ftp.quit()
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()