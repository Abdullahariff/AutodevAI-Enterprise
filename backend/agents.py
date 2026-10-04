import os
from crewai import Agent, Task, Crew, LLM
from langsmith import traceable
from backend.tools import execute_python_code
from backend.tools import execute_python_code, publish_to_gist
langsmith_project = os.getenv("LANGSMITH_PROJECT", "AutoDev-Enterprise-V1")

@traceable(name="Gemini_3_Agent_Pipeline", project_name=langsmith_project)
async def run_execution_crew(crew):
    return await crew.kickoff_async()

async def run_agentic_pipeline(requirement: str) -> str:
    gemini_llm = LLM(
        model="gemini/gemini-2.5-flash",
        api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.0
    )

    architect_agent = Agent(
        role="System Architect",
        goal="Analyze the user requirement and map out the Python logic step-by-step.",
        backstory="You are an elite software architect. You design the logic before coding begins.",
        llm=gemini_llm,
        allow_delegation=False,
        verbose=True
    )
    
    coder_agent = Agent(
        role="Senior Python Developer",
        goal="Write optimized, flawless Python code based entirely on the Architect's plan.",
        backstory="You are a master Python engineer. You only write clean, efficient, and well-commented code.",
        llm=gemini_llm,
        allow_delegation=False,
        verbose=True
    )
    
    qa_agent = Agent(
        role="Lead QA Engineer",
        goal="Execute the code using the provided Python Code Executor tool. If it errors out, fix it.",
        backstory="You are a strict QA tester. You MUST run the code using your execution tool. Only output the final working Python code.",
        llm=gemini_llm,
        tools=[execute_python_code, publish_to_gist],
        allow_delegation=False,
        verbose=True
    )
    
    plan_task = Task(
        description=f"Requirement: '{requirement}'. Write a brief step-by-step logic plan.",
        expected_output="A structured logic outline.",
        agent=architect_agent
    )
    
    code_task = Task(
        description="Using the architect's plan, write the full Python script. Return ONLY the code.",
        expected_output="A valid Python code block.",
        agent=coder_agent
    )
    
    qa_task = Task(
        description="Run the developer's code using the Python Code Executor tool. If there's an error, fix it. Check the original requirement: '{requirement}'. If the user asked to publish or share the code to Gist, use the GitHub Gist Publisher tool and include the Gist URL as a comment at the top of the final code.",
        expected_output="Final executed and verified Python code. If published to Gist, include the URL in the code comments.",
        agent=qa_agent
    )
    
    execution_crew = Crew(
        agents=[architect_agent, coder_agent, qa_agent], 
        tasks=[plan_task, code_task, qa_task], 
        verbose=True,
        
    )

    final_result_obj = await run_execution_crew(execution_crew)
    final_result = str(final_result_obj).replace("```python", "").replace("```", "").strip()
    
    return final_result