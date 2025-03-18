from zipfile import ZipFile

import requests
from tqdm import tqdm


def download_file(url: str, filename: str) -> None:
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get("content-length", 0))
    block_size = 1024
    progress_bar = tqdm(total=total_size, unit="B", unit_scale=True)

    with open(filename, "wb") as f:
        for data in response.iter_content(block_size):
            progress_bar.update(len(data))
            f.write(data)

    progress_bar.close()
    print(f"📥 Téléchargement terminé : {filename}")


def decompress_zip(input_file: str, output_file: str) -> None:
    with ZipFile(input_file, "r") as zip_ref:
        zip_ref.extractall(output_file)

    # os.remove(input_file)
    print(f"📂 Décompression terminée : {output_file}")
