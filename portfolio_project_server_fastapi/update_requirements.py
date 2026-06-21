#!/usr/bin/env python
"""
Requirements.txt 갱신 스크립트

사용법:
    python update_requirements.py           # 기본 실행
    python update_requirements.py --dev     # dev 의존성 포함
    python update_requirements.py --clean   # 불필요한 패키지 제외
"""

import subprocess
import sys
import shutil
from pathlib import Path
from datetime import datetime


def get_installed_packages() -> list[str]:
    """현재 설치된 패키지 목록을 가져옵니다."""
    result = subprocess.run(
        [sys.executable, "-m", "pip", "freeze"],
        capture_output=True,
        text=True,
        encoding="utf-8"
    )
    return result.stdout.strip().split("\n") if result.stdout.strip() else []


def backup_requirements(req_path: Path) -> Path | None:
    """기존 requirements.txt를 백업합니다."""
    if req_path.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = req_path.with_suffix(f".txt.bak_{timestamp}")
        shutil.copy(req_path, backup_path)
        return backup_path
    return None


def write_requirements(packages: list[str], output_path: Path) -> None:
    """패키지 목록을 requirements.txt에 저장합니다."""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sorted(packages, key=str.lower)))
        f.write("\n")


def main():
    print("=" * 50)
    print("  Requirements.txt 갱신 스크립트")
    print("=" * 50)
    print()

    project_root = Path(__file__).parent
    req_path = project_root / "requirements.txt"

    # 1. 기존 파일 백업
    print("[1/3] 기존 파일 백업 중...")
    backup = backup_requirements(req_path)
    if backup:
        print(f"      백업 완료: {backup.name}")
    else:
        print("      기존 파일 없음 (새로 생성)")

    # 2. 현재 패키지 목록 가져오기
    print("[2/3] 설치된 패키지 목록 추출 중...")
    packages = get_installed_packages()

    # 불필요한 패키지 필터링 (옵션)
    if "--clean" in sys.argv:
        exclude_prefixes = ["pip==", "setuptools==", "wheel=="]
        packages = [
            pkg for pkg in packages
            if not any(pkg.startswith(prefix) for prefix in exclude_prefixes)
        ]
        print("      (pip, setuptools, wheel 제외됨)")

    # 3. 파일 저장
    print("[3/3] requirements.txt 저장 중...")
    write_requirements(packages, req_path)

    print()
    print("=" * 50)
    print("  완료!")
    print("=" * 50)
    print(f"  파일: {req_path}")
    print(f"  패키지 수: {len(packages)}개")
    print("=" * 50)
    print()

    # 결과 출력
    print("패키지 목록:")
    print("-" * 50)
    for pkg in packages:
        print(f"  {pkg}")


if __name__ == "__main__":
    main()
