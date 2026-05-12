import streamlit as st
import sqlite3
import os

st.set_page_config(page_title="LiterAI Evaluation", layout="wide", page_icon="📊")

st.title("📊 LiterAI Advanced Model Evaluation")
st.markdown("Statistical analysis of LLM model performance within the LiterAI research assistant.")

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "literai.db")

@st.cache_data(ttl=60)
def load_data():
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("""
            SELECT model,
                   relevanceScore,
                   accuracyScore, 
                   clarityScore,
                   completenessScore,
                   overallScore,
                   responseTimeMs,
                   tokenCount
            FROM modelEvaluations
        """)
        rows = c.fetchall()
        conn.close()
        
        if not rows:
            return None, {}
        
        # Organize by model
        models = {}
        for row in rows:
            model = row[0]
            if model not in models:
                models[model] = {'relevance': [], 'accuracy': [], 'clarity': [], 'completeness': [], 'overall': [], 'response_time': [], 'tokens': []}
            models[model]['relevance'].append(row[1] or 0)
            models[model]['accuracy'].append(row[2] or 0)
            models[model]['clarity'].append(row[3] or 0)
            models[model]['completeness'].append(row[4] or 0)
            models[model]['overall'].append(row[5] or 0)
            models[model]['response_time'].append(row[6] or 0)
            models[model]['tokens'].append(row[7] or 0)
        
        return len(rows), models
    except Exception as e:
        st.error(f"Database error: {e}")
        return None, {}

total, models = load_data()

if total is None or not models:
    st.warning("No evaluation data found. Run `python seed_db.py` first.")
    st.stop()

# ─── Helper ───────────────────────────────────────────────────────────────────
def avg(lst):
    return sum(lst) / len(lst) if lst else 0

def std(lst):
    if len(lst) < 2: return 0
    m = avg(lst)
    return (sum((x - m) ** 2 for x in lst) / (len(lst) - 1)) ** 0.5

# ─── Overall Metrics ──────────────────────────────────────────────────────────
st.header("📈 Overall Performance Summary")

cols = st.columns(5)
all_rel = [v for m in models.values() for v in m['relevance']]
all_acc = [v for m in models.values() for v in m['accuracy']]
all_cla = [v for m in models.values() for v in m['clarity']]
all_com = [v for m in models.values() for v in m['completeness']]

cols[0].metric("Total Evaluations", f"{total}")
cols[1].metric("Avg Relevance", f"{avg(all_rel):.3f}")
cols[2].metric("Avg Accuracy", f"{avg(all_acc):.3f}")
cols[3].metric("Avg Clarity", f"{avg(all_cla):.3f}")
cols[4].metric("Avg Completeness", f"{avg(all_com):.3f}")

st.markdown("---")

# ─── Model Rankings ───────────────────────────────────────────────────────────
st.header("🏆 Model Rankings")

rankings = []
for model, data in models.items():
    overall = (avg(data['relevance']) + avg(data['accuracy']) + avg(data['clarity']) + avg(data['completeness'])) / 4
    rankings.append({
        'Model': model,
        'Relevance': f"{avg(data['relevance']):.4f}",
        'Accuracy': f"{avg(data['accuracy']):.4f}",
        'Clarity': f"{avg(data['clarity']):.4f}",
        'Completeness': f"{avg(data['completeness']):.4f}",
        'Overall': f"{overall:.4f}",
        'Samples': len(data['relevance']),
    })

rankings.sort(key=lambda x: float(x['Overall']), reverse=True)

st.table(rankings)

st.markdown("---")

# ─── Individual Model Drill-Down ──────────────────────────────────────────────
st.header("🔍 Individual Model Analysis")

selected_model = st.selectbox("Select Model", list(models.keys()))

if selected_model:
    data = models[selected_model]
    
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Relevance", f"{avg(data['relevance']):.4f}", f"±{std(data['relevance']):.4f}")
    col2.metric("Accuracy", f"{avg(data['accuracy']):.4f}", f"±{std(data['accuracy']):.4f}")
    col3.metric("Clarity", f"{avg(data['clarity']):.4f}", f"±{std(data['clarity']):.4f}")
    col4.metric("Completeness", f"{avg(data['completeness']):.4f}", f"±{std(data['completeness']):.4f}")
    
    st.subheader("Score Distribution")
    
    import json
    chart_data = {
        'Relevance': data['relevance'],
        'Accuracy': data['accuracy'],
        'Clarity': data['clarity'],
        'Completeness': data['completeness'],
    }
    
    # Simple bar chart with Streamlit built-in
    avg_data = {k: avg(v) for k, v in chart_data.items()}
    st.bar_chart(avg_data)
    
    st.subheader("Performance Statistics")
    stats_table = []
    for metric in ['relevance', 'accuracy', 'clarity', 'completeness']:
        vals = data[metric]
        stats_table.append({
            'Metric': metric.capitalize(),
            'Mean': f"{avg(vals):.4f}",
            'Std Dev': f"{std(vals):.4f}",
            'Min': f"{min(vals):.4f}",
            'Max': f"{max(vals):.4f}",
            'Samples': len(vals),
        })
    st.table(stats_table)

st.markdown("---")
st.caption("LiterAI Advanced Evaluation Dashboard • Data from literai.db")
