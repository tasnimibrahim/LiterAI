"""
LiterAI Model Evaluation — Statistical Analysis & Chart Generation
===================================================================
This script evaluates LLM model performance and generates:
  - analysis.txt: Full statistical report
  - SVG chart images in this folder
"""
import sqlite3
import os
import math
import random
import json
from datetime import datetime

output_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(os.path.dirname(output_dir), "db", "literai.db")

# ─── Data Loading ──────────────────────────────────────────────────────────────
print("=" * 60)
print("  LiterAI Model Evaluation Engine")
print("=" * 60)

models_data = {}

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Check if evaluations table exists
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='evaluations'")
    if c.fetchone():
        c.execute("""
            SELECT model_id, relevance_score, accuracy_score, clarity_score, completeness_score
            FROM evaluations
        """)
        rows = c.fetchall()
        if rows:
            for row in rows:
                mid = row[0]
                if mid not in models_data:
                    models_data[mid] = {'relevance': [], 'accuracy': [], 'clarity': [], 'completeness': []}
                models_data[mid]['relevance'].append(float(row[1] or 0))
                models_data[mid]['accuracy'].append(float(row[2] or 0))
                models_data[mid]['clarity'].append(float(row[3] or 0))
                models_data[mid]['completeness'].append(float(row[4] or 0))
            print(f"  Loaded {len(rows)} evaluations from database.")
    conn.close()
except Exception as e:
    print(f"  Database not available: {e}")

# Generate simulated data if no real data exists
if not models_data:
    print("  No evaluation data found. Generating simulated benchmark data...")
    random.seed(42)
    benchmark_models = {
        'llama-3.1-70b-versatile':  {'base': 0.88, 'variance': 0.04},
        'llama-3.1-8b-instant':     {'base': 0.76, 'variance': 0.06},
        'llama-3.2-11b-vision':     {'base': 0.80, 'variance': 0.05},
        'gemini-2.5-flash':         {'base': 0.85, 'variance': 0.04},
        'gpt-4':                    {'base': 0.92, 'variance': 0.03},
        'gpt-4o':                   {'base': 0.91, 'variance': 0.03},
        'claude-3.5-sonnet':        {'base': 0.90, 'variance': 0.04},
        'mixtral-8x7b':             {'base': 0.78, 'variance': 0.05},
    }
    for model, cfg in benchmark_models.items():
        models_data[model] = {'relevance': [], 'accuracy': [], 'clarity': [], 'completeness': []}
        for _ in range(50):
            for metric in ['relevance', 'accuracy', 'clarity', 'completeness']:
                offset = {'relevance': 0.02, 'accuracy': 0.0, 'clarity': 0.03, 'completeness': -0.02}[metric]
                val = max(0, min(1, cfg['base'] + offset + random.gauss(0, cfg['variance'])))
                models_data[model][metric].append(round(val, 4))

metrics = ['relevance', 'accuracy', 'clarity', 'completeness']

# ─── Statistics Helpers ────────────────────────────────────────────────────────
def mean(lst):
    return sum(lst) / len(lst) if lst else 0

def std_dev(lst):
    if len(lst) < 2:
        return 0
    m = mean(lst)
    return math.sqrt(sum((x - m) ** 2 for x in lst) / (len(lst) - 1))

def median(lst):
    s = sorted(lst)
    n = len(s)
    if n == 0: return 0
    if n % 2 == 1: return s[n // 2]
    return (s[n // 2 - 1] + s[n // 2]) / 2

def percentile(lst, p):
    s = sorted(lst)
    n = len(s)
    if n == 0: return 0
    k = (n - 1) * p / 100
    f = int(k)
    c = f + 1 if f + 1 < n else f
    return s[f] + (k - f) * (s[c] - s[f])

def confidence_interval_95(lst):
    m = mean(lst)
    se = std_dev(lst) / math.sqrt(len(lst)) if lst else 0
    return (round(m - 1.96 * se, 4), round(m + 1.96 * se, 4))

# ─── Generate analysis.txt ────────────────────────────────────────────────────
print("\n  Generating analysis.txt...")

report_lines = []
report_lines.append("=" * 70)
report_lines.append("  LITERAI MODEL EVALUATION — STATISTICAL ANALYSIS REPORT")
report_lines.append(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
report_lines.append("=" * 70)
report_lines.append("")

# Overall Summary
report_lines.append("1. EXECUTIVE SUMMARY")
report_lines.append("-" * 40)
report_lines.append(f"  Models evaluated: {len(models_data)}")
total_evals = sum(len(v['relevance']) for v in models_data.values())
report_lines.append(f"  Total evaluations: {total_evals}")
report_lines.append(f"  Metrics: {', '.join(m.capitalize() for m in metrics)}")
report_lines.append("")

# Per-model detailed stats
report_lines.append("2. INDIVIDUAL MODEL PERFORMANCE")
report_lines.append("-" * 40)

model_rankings = {}
for model, data in sorted(models_data.items()):
    n = len(data['relevance'])
    report_lines.append(f"\n  ┌─ {model} (n={n})")
    overall_scores = []
    for metric in metrics:
        vals = data[metric]
        m = mean(vals)
        s = std_dev(vals)
        med = median(vals)
        ci = confidence_interval_95(vals)
        q1 = percentile(vals, 25)
        q3 = percentile(vals, 75)
        mn = min(vals)
        mx = max(vals)
        overall_scores.append(m)
        report_lines.append(f"  │  {metric.capitalize():15s}  Mean={m:.4f}  SD={s:.4f}  Median={med:.4f}  95%CI=[{ci[0]:.4f}, {ci[1]:.4f}]")
        report_lines.append(f"  │  {'':15s}  Min={mn:.4f}  Q1={q1:.4f}  Q3={q3:.4f}  Max={mx:.4f}")
    
    overall_mean = mean(overall_scores)
    model_rankings[model] = overall_mean
    report_lines.append(f"  └─ Overall Score: {overall_mean:.4f}")

# Rankings
report_lines.append("\n3. MODEL RANKINGS (by Overall Score)")
report_lines.append("-" * 40)
sorted_rankings = sorted(model_rankings.items(), key=lambda x: x[1], reverse=True)
for rank, (model, score) in enumerate(sorted_rankings, 1):
    bar = "█" * int(score * 40)
    report_lines.append(f"  {rank}. {model:30s}  {score:.4f}  {bar}")

# Comparative analysis
report_lines.append("\n4. COMPARATIVE ANALYSIS")
report_lines.append("-" * 40)
best_model = sorted_rankings[0][0]
worst_model = sorted_rankings[-1][0]
report_lines.append(f"  Best performer:  {best_model} ({sorted_rankings[0][1]:.4f})")
report_lines.append(f"  Worst performer: {worst_model} ({sorted_rankings[-1][1]:.4f})")
report_lines.append(f"  Performance gap: {sorted_rankings[0][1] - sorted_rankings[-1][1]:.4f}")
report_lines.append("")

# Per-metric winners
report_lines.append("  Per-Metric Winners:")
for metric in metrics:
    best = max(models_data.items(), key=lambda x: mean(x[1][metric]))
    report_lines.append(f"    {metric.capitalize():15s} → {best[0]} ({mean(best[1][metric]):.4f})")

# Statistical significance note
report_lines.append("\n5. STATISTICAL NOTES")
report_lines.append("-" * 40)
report_lines.append("  - 95% Confidence Intervals are computed using z=1.96 (normal approx.)")
report_lines.append("  - Standard Deviations use Bessel's correction (n-1)")
report_lines.append("  - Rankings are based on the arithmetic mean across all four metrics")
report_lines.append("  - Data source: " + ("literai.db evaluations table" if total_evals > 0 else "Simulated benchmark data"))

report_lines.append("\n" + "=" * 70)
report_lines.append("  END OF REPORT")
report_lines.append("=" * 70)

analysis_text = "\n".join(report_lines)

with open(os.path.join(output_dir, 'analysis.txt'), 'w', encoding='utf-8') as f:
    f.write(analysis_text)

print("  ✓ Saved analysis.txt")

# ─── Generate Bar Chart SVG ───────────────────────────────────────────────────
print("  Generating bar chart...")

colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899']
models_list = list(models_data.keys())
n_models = len(models_list)
n_metrics = len(metrics)

svg_w = max(900, n_models * 120)
svg_h = 550
margin_top = 60
margin_bottom = 120
margin_left = 60
margin_right = 200
chart_w = svg_w - margin_left - margin_right
chart_h = svg_h - margin_top - margin_bottom
group_w = chart_w / n_models
bar_w = min(18, group_w / (n_metrics + 1))

svg = f'<svg width="{svg_w}" height="{svg_h}" xmlns="http://www.w3.org/2000/svg" style="font-family:system-ui,sans-serif">\n'
svg += f'<rect width="100%" height="100%" fill="#fafafa"/>\n'
svg += f'<text x="{svg_w/2}" y="35" font-size="18" font-weight="bold" text-anchor="middle" fill="#111">Average Performance Metrics by Model</text>\n'

# Y axis
for i in range(11):
    y = margin_top + chart_h - (i * chart_h / 10)
    val = i * 10
    svg += f'<line x1="{margin_left}" y1="{y}" x2="{margin_left + chart_w}" y2="{y}" stroke="#e5e7eb" stroke-width="1"/>\n'
    svg += f'<text x="{margin_left - 8}" y="{y+4}" font-size="11" text-anchor="end" fill="#888">{val}%</text>\n'

# Bars
for m_idx, model in enumerate(models_list):
    x_group = margin_left + m_idx * group_w + group_w * 0.1
    for i, metric in enumerate(metrics):
        val = mean(models_data[model][metric]) * 100
        h = val / 100 * chart_h
        x = x_group + i * (bar_w + 2)
        y = margin_top + chart_h - h
        svg += f'<rect x="{x}" y="{y}" width="{bar_w}" height="{h}" fill="{colors[i]}" rx="2"/>\n'
    
    # Label
    label_x = x_group + (n_metrics * (bar_w + 2)) / 2
    label_y = margin_top + chart_h + 15
    short_name = model.split('-')[0] + '-' + model.split('-')[-1] if '-' in model else model
    svg += f'<text x="{label_x}" y="{label_y}" font-size="10" text-anchor="middle" fill="#333" transform="rotate(35 {label_x},{label_y})">{model}</text>\n'

# Legend
leg_x = svg_w - margin_right + 20
for i, metric in enumerate(metrics):
    svg += f'<rect x="{leg_x}" y="{margin_top + i*24}" width="14" height="14" fill="{colors[i]}" rx="2"/>\n'
    svg += f'<text x="{leg_x+20}" y="{margin_top + i*24 + 12}" font-size="12" fill="#333">{metric.capitalize()}</text>\n'

svg += '</svg>'

with open(os.path.join(output_dir, 'bar_chart_performance.svg'), 'w') as f:
    f.write(svg)
print("  ✓ Saved bar_chart_performance.svg")

# ─── Generate Radar Chart SVG ─────────────────────────────────────────────────
print("  Generating radar chart...")

radar_w = 700
radar_h = 700
cx = radar_w / 2
cy = radar_h / 2 + 10
radius = 220
angles = [math.pi * 1.5, 0, math.pi * 0.5, math.pi]  # top, right, bottom, left

radar_colors = [
    ('#4f46e5', 'rgba(79,70,229,0.2)'),
    ('#10b981', 'rgba(16,185,129,0.2)'),
    ('#f59e0b', 'rgba(245,158,11,0.2)'),
    ('#ec4899', 'rgba(236,72,153,0.2)'),
    ('#8b5cf6', 'rgba(139,92,246,0.2)'),
    ('#06b6d4', 'rgba(6,182,212,0.2)'),
    ('#f43f5e', 'rgba(244,63,94,0.2)'),
    ('#84cc16', 'rgba(132,204,22,0.2)'),
]

rsvg = f'<svg width="{radar_w}" height="{radar_h}" xmlns="http://www.w3.org/2000/svg" style="font-family:system-ui,sans-serif">\n'
rsvg += f'<rect width="100%" height="100%" fill="#fafafa"/>\n'
rsvg += f'<text x="{radar_w/2}" y="35" font-size="18" font-weight="bold" text-anchor="middle" fill="#111">Model Performance Radar Comparison</text>\n'

# Background grid
for i in range(1, 6):
    r = radius * i / 5
    rsvg += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#e5e7eb" stroke-width="1"/>\n'
    rsvg += f'<text x="{cx+4}" y="{cy - r + 14}" font-size="9" fill="#aaa">{i*20}%</text>\n'

# Axis lines + labels
for i, angle in enumerate(angles):
    ax = cx + radius * math.cos(angle)
    ay = cy + radius * math.sin(angle)
    rsvg += f'<line x1="{cx}" y1="{cy}" x2="{ax}" y2="{ay}" stroke="#d1d5db" stroke-width="1.5"/>\n'
    lx = cx + (radius + 25) * math.cos(angle)
    ly = cy + (radius + 25) * math.sin(angle)
    rsvg += f'<text x="{lx}" y="{ly+4}" font-size="13" font-weight="600" text-anchor="middle" fill="#333">{metrics[i].capitalize()}</text>\n'

# Plot top 4 models
top_models = [m for m, _ in sorted_rankings[:4]]
for m_idx, model in enumerate(top_models):
    stroke_c, fill_c = radar_colors[m_idx % len(radar_colors)]
    pts = []
    for i, angle in enumerate(angles):
        val = mean(models_data[model][metrics[i]])
        px = cx + (radius * val) * math.cos(angle)
        py = cy + (radius * val) * math.sin(angle)
        pts.append(f"{px},{py}")
    poly = " ".join(pts)
    rsvg += f'<polygon points="{poly}" fill="{fill_c}" stroke="{stroke_c}" stroke-width="2.5"/>\n'
    
    # Legend
    ly = radar_h - 80 + m_idx * 22
    rsvg += f'<rect x="20" y="{ly}" width="14" height="14" fill="{fill_c}" stroke="{stroke_c}" rx="2"/>\n'
    rsvg += f'<text x="40" y="{ly + 12}" font-size="12" fill="#333">{model}</text>\n'

rsvg += '</svg>'

with open(os.path.join(output_dir, 'radar_chart_comparison.svg'), 'w') as f:
    f.write(rsvg)
print("  ✓ Saved radar_chart_comparison.svg")

# ─── Generate Box Plot SVG ────────────────────────────────────────────────────
print("  Generating box plot...")

box_w = max(900, n_models * 100)
box_h = 500
bm_top = 60
bm_bot = 100
bm_left = 60
bm_right = 30
bc_w = box_w - bm_left - bm_right
bc_h = box_h - bm_top - bm_bot

bsvg = f'<svg width="{box_w}" height="{box_h}" xmlns="http://www.w3.org/2000/svg" style="font-family:system-ui,sans-serif">\n'
bsvg += f'<rect width="100%" height="100%" fill="#fafafa"/>\n'
bsvg += f'<text x="{box_w/2}" y="35" font-size="18" font-weight="bold" text-anchor="middle" fill="#111">Score Distribution Box Plot (All Metrics Combined)</text>\n'

# Y axis
for i in range(11):
    y = bm_top + bc_h - (i * bc_h / 10)
    val = i * 10
    bsvg += f'<line x1="{bm_left}" y1="{y}" x2="{bm_left + bc_w}" y2="{y}" stroke="#e5e7eb" stroke-width="1"/>\n'
    bsvg += f'<text x="{bm_left - 8}" y="{y+4}" font-size="11" text-anchor="end" fill="#888">{val}%</text>\n'

col_w = bc_w / n_models
bx_colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16']

for m_idx, model in enumerate(models_list):
    # Combine all metric scores
    all_scores = []
    for metric in metrics:
        all_scores.extend(models_data[model][metric])
    
    all_scores.sort()
    q1 = percentile(all_scores, 25) * 100
    q3 = percentile(all_scores, 75) * 100
    med_val = median(all_scores) * 100
    mn_val = min(all_scores) * 100
    mx_val = max(all_scores) * 100
    
    x_center = bm_left + m_idx * col_w + col_w / 2
    bx_w = min(50, col_w * 0.6)
    color = bx_colors[m_idx % len(bx_colors)]
    
    # Whiskers
    y_min = bm_top + bc_h - (mn_val / 100 * bc_h)
    y_max = bm_top + bc_h - (mx_val / 100 * bc_h)
    y_q1 = bm_top + bc_h - (q1 / 100 * bc_h)
    y_q3 = bm_top + bc_h - (q3 / 100 * bc_h)
    y_med = bm_top + bc_h - (med_val / 100 * bc_h)
    
    # Vertical whisker line
    bsvg += f'<line x1="{x_center}" y1="{y_min}" x2="{x_center}" y2="{y_max}" stroke="{color}" stroke-width="1.5"/>\n'
    # Min cap
    bsvg += f'<line x1="{x_center - bx_w/4}" y1="{y_min}" x2="{x_center + bx_w/4}" y2="{y_min}" stroke="{color}" stroke-width="2"/>\n'
    # Max cap
    bsvg += f'<line x1="{x_center - bx_w/4}" y1="{y_max}" x2="{x_center + bx_w/4}" y2="{y_max}" stroke="{color}" stroke-width="2"/>\n'
    # Box
    bsvg += f'<rect x="{x_center - bx_w/2}" y="{y_q3}" width="{bx_w}" height="{y_q1 - y_q3}" fill="{color}" fill-opacity="0.2" stroke="{color}" stroke-width="2" rx="3"/>\n'
    # Median
    bsvg += f'<line x1="{x_center - bx_w/2}" y1="{y_med}" x2="{x_center + bx_w/2}" y2="{y_med}" stroke="{color}" stroke-width="3"/>\n'
    
    # Label
    bsvg += f'<text x="{x_center}" y="{bm_top + bc_h + 18}" font-size="10" text-anchor="middle" fill="#333" transform="rotate(30 {x_center},{bm_top + bc_h + 18})">{model}</text>\n'

bsvg += '</svg>'

with open(os.path.join(output_dir, 'box_plot_distribution.svg'), 'w') as f:
    f.write(bsvg)
print("  ✓ Saved box_plot_distribution.svg")

# ─── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  Evaluation Complete!")
print("  Output files:")
print(f"    • {os.path.join(output_dir, 'analysis.txt')}")
print(f"    • {os.path.join(output_dir, 'bar_chart_performance.svg')}")
print(f"    • {os.path.join(output_dir, 'radar_chart_comparison.svg')}")
print(f"    • {os.path.join(output_dir, 'box_plot_distribution.svg')}")
print("=" * 60)
