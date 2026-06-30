import os
from langchain_huggingface import HuggingFaceEmbeddings

try:
    base_dir = os.path.abspath(os.path.dirname(__file__))
    model_path = os.path.join(base_dir, "all-MiniLM-L6-v2")
    
    print(f"Loading from local path: {model_path}")
    emb = HuggingFaceEmbeddings(model_name=model_path)
    res = emb.embed_query("hello world")
    print("Success! Vector length:", len(res))
except Exception as e:
    import traceback
    traceback.print_exc()
    print("Error:", e)
