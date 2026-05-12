"""
Create the modelEvaluations table and seed it with benchmark data.
"""
import sqlite3
import os
import random

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "literai.db")
print(f"Database: {db_path}")

conn = sqlite3.connect(db_path)
c = conn.cursor()

# Create the table if it doesn't exist
c.execute("""
    CREATE TABLE IF NOT EXISTS modelEvaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chatId INTEGER NOT NULL,
        messageId INTEGER NOT NULL,
        model TEXT NOT NULL,
        relevanceScore REAL,
        accuracyScore REAL,
        completenessScore REAL,
        clarityScore REAL,
        overallScore REAL,
        responseTimeMs INTEGER,
        tokenCount INTEGER,
        qualityMetrics TEXT DEFAULT '{}',
        evaluationDetails TEXT,
        createdAt INTEGER
    )
""")
print("  ✓ Table modelEvaluations ensured.")

# Check if data exists
c.execute("SELECT COUNT(*) FROM modelEvaluations")
count = c.fetchone()[0]

if count == 0:
    print("  Seeding benchmark evaluation data...")
    random.seed(42)
    
    benchmarks = {
        'llama-3.1-70b-versatile':  {'base': 0.88, 'var': 0.04},
        'llama-3.1-8b-instant':     {'base': 0.76, 'var': 0.06},
        'llama-3.2-11b-vision-preview': {'base': 0.80, 'var': 0.05},
        'gemini-2.5-flash':         {'base': 0.85, 'var': 0.04},
        'gpt-4':                    {'base': 0.92, 'var': 0.03},
        'gpt-4o':                   {'base': 0.91, 'var': 0.03},
        'claude-3.5-sonnet':        {'base': 0.90, 'var': 0.04},
        'mixtral-8x7b':             {'base': 0.78, 'var': 0.05},
    }
    
    import time
    now = int(time.time())
    
    for model, cfg in benchmarks.items():
        for i in range(30):
            rel = max(0, min(1, cfg['base'] + 0.02 + random.gauss(0, cfg['var'])))
            acc = max(0, min(1, cfg['base'] + random.gauss(0, cfg['var'])))
            cla = max(0, min(1, cfg['base'] + 0.03 + random.gauss(0, cfg['var'])))
            com = max(0, min(1, cfg['base'] - 0.02 + random.gauss(0, cfg['var'])))
            overall = (rel + acc + cla + com) / 4
            rt = random.randint(500, 5000)
            tc = random.randint(100, 2000)
            
            c.execute("""
                INSERT INTO modelEvaluations 
                (chatId, messageId, model, relevanceScore, accuracyScore, completenessScore, clarityScore, overallScore, responseTimeMs, tokenCount, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (1, i+1, model, round(rel,4), round(acc,4), round(com,4), round(cla,4), round(overall,4), rt, tc, now - random.randint(0, 86400*30)))
    
    conn.commit()
    c.execute("SELECT COUNT(*) FROM modelEvaluations")
    count = c.fetchone()[0]
    print(f"  ✓ Seeded {count} evaluation records.")
else:
    print(f"  Already has {count} records. Skipping seed.")

conn.close()
print("  Done!")
