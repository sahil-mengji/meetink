import os
import urllib.request
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

repo_url = "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main"

def process_lfs_files(dir_path):
    for root, _, files in os.walk(dir_path):
        for file in files:
            filepath = os.path.join(root, file)
            # Read first few bytes to see if it's an LFS pointer
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read(200)
                if content.startswith("version https://git-lfs.github.com/spec/v1"):
                    print(f"Found LFS pointer: {filepath}")
                    rel_path = os.path.relpath(filepath, dir_path).replace("\\", "/")
                    download_url = f"{repo_url}/{rel_path}"
                    print(f"Downloading from {download_url}...")
                    urllib.request.urlretrieve(download_url, filepath)
                    print(f"Successfully downloaded {file}")
            except UnicodeDecodeError:
                pass # Binary file, not an LFS pointer
            except Exception as e:
                print(f"Error checking {file}: {e}")

if __name__ == "__main__":
    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "all-MiniLM-L6-v2"))
    process_lfs_files(target_dir)
