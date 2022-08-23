from typing import Tuple
from typing import List
import threading
import requests
import sys

METHOD = {"http": "http", "https": "https",
          "socks4": "socks5", "socks5": "socks5"}


def check_proxy(test_url: str, type: str, ip: str, port: str) -> Tuple[str, bool]:
    if type not in METHOD:
        raise Exception("Error")

    proxies = {
        'https': f'{type}://{ip}:{port}',
        'http': f'{type}://{ip}:{port}'
    }

    try:
        response = requests.get(test_url, proxies=proxies)
    except:
        return (f'{type}://{ip}:{port}', False)

    status_code = response.status_code

    if status_code == 200:
        print(f'{type}://{ip}:{port}', True)
        return (f'{type}://{ip}:{port}', True)
    return (f'{type}://{ip}:{port}', False)


def read_list_proxy_shell() -> List[str]:
    params = sys.stdin.readlines()
    return [s.strip() for s in params]


method = sys.argv[1]
if method == "":
    print("lack of type proxy")
    exit(1)

proxies = read_list_proxy_shell()

TEST_URL = "https://dantri.com.vn"

def result(proxies: List[str]):
    for proxy in proxies:
        spl = proxy.split(":")
        ip = spl[0]
        port = spl[1]
        threading.Thread(target=check_proxy, args=(
            TEST_URL, method, ip, port)).start()


result(proxies)
