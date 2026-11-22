"""
build_data.py - data for web_proto_v1 (VRU story: pedestrians and cyclists).

Reads the original BITRE workbooks (../../data) and the ABS LGA population
datacube (../../COS30045---Final-Project/data/raw/abs), and writes small CSVs to
../data for the D3 front-end.

This is a prototype stand-in. Every step maps onto a KNIME node
(Excel Reader -> Row Filter -> Rule Engine -> GroupBy -> Math Formula -> Joiner
-> CSV Writer) and the final figures must come from the team's KNIME workflow.

Definitions (match Design Book v2, section 1):
  * Hospitalisations = BITRE "Hospitalisations" (excludes died within 30 days)
  * Length of stay   = (Bed days - Died_bed_days) / Hospitalisations
  * Died rate        = Died_cases / (Hospitalisations + Died_cases)

GenAI acknowledgement: drafted with Claude (Anthropic), to be reviewed by the team.
"""
from pathlib import Path
import pandas as pd

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent.parent
BITRE = PROJECT / "data"
ABS = PROJECT / "COS30045---Final-Project" / "data" / "raw" / "abs" / "32350DS0006_2001-25_ABS.xlsx"
OUT = HERE.parent / "data"
OUT.mkdir(exist_ok=True)

NATIONAL = BITRE / "hospitalisation_injury_publication_sep2023.xlsx"
STATE = BITRE / "state-and-territory-hospitalisation-injury-publication-2023.xlsx"

MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]
AGE_ORDER = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "75+"]
YEARS = range(2011, 2022)

GROUP = {  # 12 BITRE road users -> 5 groups (same grouping as the KNIME workflow)
    "Car driver": "Car occupant", "Car passenger": "Car occupant",
    "Car unknown position": "Car occupant",
    "Motorcyclist": "Motorcyclist", "Pedal cyclist": "Pedal cyclist",
    "Pedestrian": "Pedestrian",
}
COUNTERPARTY = {  # 10 BITRE counterparties -> 6 readable groups
    "Car, pick-up truck or van": "Car, pick-up truck or van",
    "Heavy transport vehicle or bus": "Heavy vehicle or bus",
    "2- or 3- wheeled motor vehicle": "Motorcycle",
    "Fixed or stationary object": "Fixed object",
    "Non-collision transport accident": "No collision (e.g. fall)",
}


def write(df, name):
    df.to_csv(OUT / name, index=False)
    print(f"  {name:26s} {len(df):>4} rows")


def national():
    raw = pd.read_excel(NATIONAL, sheet_name="raw")
    t = raw[raw["Cause of injury"] == "Traffic"].copy()
    t["hosp"] = t["Hospitalisations"].fillna(0)
    t["bed"] = t["Bed days"].fillna(0) - t["Died_bed_days"].fillna(0)
    t["died"] = t["Died_cases"].fillna(0)
    t["group"] = t["Road user"].map(GROUP).fillna("Other")
    t["cp"] = t["Counterparty"].map(COUNTERPARTY).fillna("Other")
    t["month"] = t["Month"].map({m: i + 1 for i, m in enumerate(MONTHS)})
    vru = t[t["group"].isin(["Pedestrian", "Pedal cyclist"])]

    # 1. Year x group: counts (trend + hero numbers)
    yr = t.groupby(["Calendar year", "group"])[["hosp", "bed", "died"]].sum().reset_index()
    write(yr.rename(columns={"Calendar year": "year"}), "group_year.csv")

    # 2. Severity per group, 2011-2021
    s = t.groupby("group")[["hosp", "bed", "died"]].sum()
    s["los"] = s.bed / s.hosp
    s["died_rate"] = s.died / (s.hosp + s.died)
    s["share_hosp"] = s.hosp / s.hosp.sum()
    s["share_bed"] = s.bed / s.bed.sum()
    write(s.reset_index().round(4), "severity.csv")

    # 3. What pedestrians and cyclists collide with
    cp = vru.groupby(["group", "cp"])["hosp"].sum().reset_index()
    cp["share"] = cp.hosp / cp.groupby("group").hosp.transform("sum")
    write(cp.round(4), "counterparty.csv")

    # 4. Season: average hospitalisations per calendar month, as a ratio to the
    #    average month (1.0 = typical). 2011-2019 only, so COVID lockdowns do
    #    not distort the seasonal shape.
    pre = vru[vru["Calendar year"] <= 2019]
    m = pre.groupby(["group", "month"])["hosp"].sum().reset_index()
    m["index"] = m.hosp / m.groupby("group").hosp.transform("mean")
    write(m.round(3), "season.csv")

    # 5. Age: counts, LOS and died rate for VRU groups (Missing age excluded)
    a = vru[vru["Age group"] != "Missing"]
    ag = a.groupby(["group", "Age group"])[["hosp", "bed", "died"]].sum().reset_index()
    ag = ag.rename(columns={"Age group": "age"})
    ag["los"] = ag.bed / ag.hosp
    ag["died_rate"] = ag.died / (ag.hosp + ag.died)
    return ag


def abs_population():
    """Persons by 5-year age band, summed over LGAs, per state and year."""
    d = pd.read_excel(ABS, sheet_name="Table 3", header=None, skiprows=6)
    bands = ["0-4", "5-9", "10-14", "15-19", "20-24", "25-29", "30-34", "35-39",
             "40-44", "45-49", "50-54", "55-59", "60-64", "65-69", "70-74",
             "75-79", "80-84", "85+", "total"]
    d = d.iloc[:, :5 + len(bands)]
    d.columns = ["year", "st_code", "state", "lga_code", "lga"] + bands
    d = d[pd.to_numeric(d["year"], errors="coerce").between(2011, 2021)]
    d["year"] = d["year"].astype(int)
    for b in bands:
        d[b] = pd.to_numeric(d[b], errors="coerce").fillna(0)
    return d.groupby(["year", "state"])[bands].sum().reset_index()


def age_rates(ag, pop):
    """BITRE age groups do not line up with ABS 5-year bands, so bands are
    split evenly by single year of age (an approximation, stated on the page)."""
    nat = pop.groupby("year").sum(numeric_only=True)
    w = {  # BITRE group -> {ABS band: share of that band}
        "0-7": {"0-4": 1, "5-9": .6},
        "8-16": {"5-9": .4, "10-14": 1, "15-19": .4},
        "17-25": {"15-19": .6, "20-24": 1, "25-29": .2},
        "26-39": {"25-29": .8, "30-34": 1, "35-39": 1},
        "40-64": {b: 1 for b in ["40-44", "45-49", "50-54", "55-59", "60-64"]},
        "65-74": {"65-69": 1, "70-74": 1},
        "75+": {"75-79": 1, "80-84": 1, "85+": 1},
    }
    avg_pop = {g: sum(nat[b] * s for b, s in m.items()).mean() for g, m in w.items()}
    ag["pop"] = ag["age"].map(avg_pop)
    ag["rate"] = ag.hosp / len(YEARS) / ag["pop"] * 1e5  # per 100,000 per year
    ag["exact_pop"] = ag["age"].isin(["40-64", "65-74", "75+"])
    ag["age"] = pd.Categorical(ag["age"], AGE_ORDER, ordered=True)
    write(ag.sort_values(["group", "age"]).round(4), "age.csv")
    return nat["total"]


def states(pop):
    """Pedestrian and cyclist rates per 100,000 by state, 2011-2021."""
    from itertools import groupby  # noqa: F401  (kept simple below)
    sheet = pd.read_excel(STATE, sheet_name="raw", header=None)
    # Block 2 of the raw tab = state x road user (blocks split by empty columns)
    blocks, start = [], 0
    for c in range(sheet.shape[1] + 1):
        if c == sheet.shape[1] or sheet.iloc[1:, c].isna().all():
            if c > start:
                b = sheet.iloc[1:, start:c].copy()
                b.columns = [str(h).strip().lower() for h in b.iloc[0]]
                blocks.append(b.iloc[1:].dropna(how="all"))
            start = c + 1
    ru = blocks[1]
    col = lambda k: next(c for c in ru.columns if k in c)  # noqa: E731
    df = pd.DataFrame({
        "year": ru[col("calendar")].astype(int),
        "state": ru[col("state")].str.strip(),
        "road_user": ru[col("road user")].str.strip(),
        "hosp": pd.to_numeric(ru[col("count")], errors="coerce"),  # "n.p." -> NaN
    })
    df = df[df.road_user.isin(["Pedestrian", "Pedal cyclist"])]
    df = df.groupby(["state", "road_user", "year"])["hosp"].sum(min_count=1).reset_index()

    names = {"New South Wales": "NSW", "Victoria": "Vic", "Queensland": "Qld",
             "South Australia": "SA", "Western Australia": "WA", "Tasmania": "Tas",
             "Northern Territory": "NT", "Australian Capital Territory": "ACT"}
    p = pop[["year", "state", "total"]].copy()
    p["state"] = p["state"].map(names)
    df = df.merge(p, on=["year", "state"], how="left")
    df["rate"] = df.hosp / df.total * 1e5
    write(df.round(3), "state_year.csv")


if __name__ == "__main__":
    print("writing to", OUT)
    ag = national()
    pop = abs_population()
    age_rates(ag, pop)
    states(pop)
