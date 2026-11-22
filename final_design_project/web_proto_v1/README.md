# web_proto_v1 — "Outside the Car" (VRU story prototype)

Prototype website for the narrowed scope (pedestrians and cyclists, 2011–2021) and the draft of Design Book §3.

| Path | What it is |
|---|---|
| `index.html`, `css/`, `js/` | The website (D3 v7, one ES module per chart in `js/charts/`) |
| `data/*.csv` | Six small CSVs produced by `scripts/build_data.py` |
| `scripts/build_data.py` | Prototype data pipeline (BITRE raw tabs + ABS LGA population). The final figures must come from the team's KNIME workflow. |
| `design/design_book_s3.html` | Draft of Design Book §3.1–3.3: wireframe, storyboard, Table 5, design principles, Table 6, references |
| `design/img/` | Screenshots of the prototype used in the draft |

Run it locally from `final_design_project/`:

```bash
python -m http.server 8001 --directory web_proto_v1
```

Then open http://localhost:8001 (website) and http://localhost:8001/design/design_book_s3.html (Design Book draft).
Add `?theme=light` or `?theme=dark` to the website URL to force a theme (used for screenshots).

Rebuild the data:

```bash
python web_proto_v1/scripts/build_data.py
```

Open issues before submission:
- Length of stay: this prototype subtracts died-in-hospital bed days (9.1 days for pedestrians, as in Design Book §1 v2); the KNIME workflow does not (9.2). Agree on one definition.
- All references in the §3 draft and the Ch5 action sources still need to be opened and checked.

GenAI: drafted with Claude (Anthropic); record in `GENAI_LOG.md` and review before use.
