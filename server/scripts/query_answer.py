import sys
import os
import lancedb
from predictionguard import PredictionGuard
import nltk
import json
import numpy as np

client = PredictionGuard(api_key=os.getenv("PREDICTIONGUARD_API_KEY"))
question = sys.stdin.read().strip()


db = lancedb.connect("/tmp/lancedb")
table = db.open_table("scratch")

def fetch_meeting_dates():
    db = lancedb.connect("/tmp/lancedb")
    if "scratch" not in db.table_names():
        return []

    table = db.open_table("scratch")
    df = table.to_pandas()

    meeting_dates = df["meeting_date"].unique().tolist()
    return meeting_dates

def pg_embedder(chunk):
    response = client.embeddings.create(
        model="bridgetower-large-itm-mlm-itc",
        input=[{"text": chunk}]
    )
    embed = response['data'][0]['embedding']
    return embed


query_embedding = pg_embedder(question)
 

k = 5
result = table.search(query_embedding).limit(k).to_list()
context = [r["text"] for r in result]


base_prompt = """Provide answer to the user question based on the context

User question: {}

Context:
{}
"""

prompt = f"{base_prompt.format(question, context)}"
messages = [
    {"role": "system", "content": prompt}
]

response = client.chat.completions.create(
    model="Hermes-3-Llama-3.1-8B",
    messages=messages
)

bot_response = response['choices'][0]['message']['content'].strip()


print(bot_response)
