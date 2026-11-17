# kac-shared: 한국공항공사 기록물 하네스 공용 데이터

여러 하네스가 함께 읽는 데이터와 준비 스크립트를 둔다. 하네스는 이 폴더를 읽기만 한다.

| 경로 | 내용 |
| --- | --- |
| `data/sources.json` | 원본 엑셀 경로(이 폴더 기준 상대 경로) |
| `data/classification.json` | 분류기준표 색인. `files`(기록물철, F0001 형식), `units`(단위업무, U0001 형식), `commons`(부서공통 항목, C001 형식) |
| `data/dept_map.json` | 문서목록의 부서명과 분류기준표 부서레벨의 대응표. 유형: 직접, 준용, 승계추정, 대상외 |
| `data/production.sqlite` | 생산·접수 문서목록 1,076,767건. `docs` 표(doc_id, 연도, 부서명, 문서구분, 등록일자, 문서번호, 제목, 수신발신처, 공개여부, 제목키) |
| `scripts/build_index.py` | 분류기준표·비공개 세부기준 엑셀에서 `classification.json`을 다시 만든다 |
| `scripts/extract_titles.py` | 문서목록 엑셀에서 `production.sqlite`를 다시 만든다(약 1분) |
| `scripts/kac_common.py` | 경로, 셀 값 정리, 제목키 함수 |

원본 엑셀이 바뀌면 두 스크립트를 다시 실행한다.

```bash
python3 kac-shared/scripts/build_index.py
python3 kac-shared/scripts/extract_titles.py
```

알아 둘 점

- 문서목록에는 기록물철·단위업무 열이 없다. 부서명, 문서구분, 제목, 수신·발신처만 있다.
- 문서목록의 부서명(65개)은 분류기준표의 부서레벨(1)과 표기가 다르고, 제주·김해 운영단·시설단과 대부분의 지방 공항은 분류기준표에 항목이 없다. `dept_map.json`의 준용·승계추정 항목은 추정이므로 직제규정으로 확인해야 한다.
- 분류기준표 1,663행 가운데 비상계획실 34행은 단위업무명·기록물철명이 비어 있고, 8행은 기록물철명이 확정되지 않았다(`철배정가능: false`).
