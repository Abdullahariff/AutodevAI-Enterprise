import os
import google.generativeai as genai
from dotenv import load_dotenv, find_dotenv
from supabase import create_client, Client
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


from backend.agents import run_agentic_pipeline

# 1. Environment Setup
load_dotenv(find_dotenv(), override=True)
os.environ["CREWAI_DISABLE_TELEMETRY"] = "true"
os.environ["CREWAI_DISABLE_TRACKING"] = "true"

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

app = FastAPI(title="AutoDev AI Enterprise")

# Enable CORS for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    requirement: str

class SaveCodeRequest(BaseModel):
    user_prompt: str
    router_decision: str
    final_code: str

# 2. Advanced Security Guardrail
def check_guardrail(prompt: str) -> bool:
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        system_instruction = """
        You are a strict security guardrail for a Python Code Generator. 
        Evaluate the user's prompt. 
        Rules for VALID: Programming tasks, algorithms, automation scripts, standard software development.
        Rules for INVALID: Hacking, exploits, system deletion, non-programming theory, recipes.
        Respond with ONLY 'VALID' or 'INVALID'.
        """
        response = model.generate_content(f"{system_instruction}\n\nUser Prompt: {prompt}")
        return response.text.strip().upper() == "VALID"
    except Exception as e:
        print(f"Guardrail Error: {e}")
        return True

# 3. Semantic Caching Engine
def get_embedding(text: str) -> list:
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        result = genai.embed_content(
            model="models/gemini-embedding-2",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Embedding Error: {e}")
        return []

@app.post("/api/generate-code")
async def generate_code(request: CodeRequest):
    print(f"\n" + "="*50)
    print(f"NEW REQUEST: {request.requirement}")
    
    # Guardrail Check
    print("Running Security Guardrails...")
    if not check_guardrail(request.requirement):
        print("Guardrail Failed: Prompt Rejected!")
        return {
            "status": "rejected", 
            "message": "Guardrail Alert: This prompt is out of scope. Please ask a valid Python development question."
        }
    print("Guardrail Passed!")

    # Cache Match
    print("Checking Supabase Semantic Cache (Threshold: 0.88)...")
    try:
        prompt_embedding = get_embedding(request.requirement)
        if prompt_embedding:
            cache_result = supabase.rpc(
                'match_prompts',
                {'query_embedding': prompt_embedding, 'match_threshold': 0.88, 'match_count': 1}
            ).execute()
            
            if cache_result.data and len(cache_result.data) > 0:
                print("⚡ CACHE HIT! Bypassing agents and returning stored code.")
                return {
                    "status": "success",
                    "code": cache_result.data[0]['response_code'],
                    "router_decision": "Supabase Semantic Cache"
                }
            else:
                print("CACHE MISS! Routing task to Enterprise Agents...")
    except Exception as e:
        print(f"Cache mechanism skipped/error: {e}")

    # 4. Multi-Agent Pipeline
    print("Initializing 3-Agent Gemini Pipeline...")

    try:
        
        final_result = await run_agentic_pipeline(request.requirement)
        
        return {
            "status": "success",
            "router_decision": "Enterprise 3-Agent Pipeline",
            "code": final_result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/save-code")
async def save_code(request: SaveCodeRequest):
    try:
         supabase.table('code_logs').insert({
             "user_prompt": request.user_prompt,
             "router_decision": request.router_decision,
             "final_code": request.final_code
         }).execute()
         
         prompt_embedding = get_embedding(request.user_prompt)
         if prompt_embedding:
            supabase.table('semantic_cache').insert({
                "prompt": request.user_prompt,
                "response_code": request.final_code,
                "embedding": prompt_embedding
            }).execute()
            
         return {"status": "success", "message": "Code successfully saved to Supabase!"}
    except Exception as e:
       raise HTTPException(status_code=500, detail=str(e))