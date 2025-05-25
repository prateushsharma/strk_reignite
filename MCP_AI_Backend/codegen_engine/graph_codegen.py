import json
from groq import Groq
from pydantic import BaseModel
from typing import List, Dict, Any


class ResponseFormat(BaseModel):
    requirements: List[str]
    imports: List[str]
    code: str


def get_prompt(json_data):
    return f"""
**Objective**: Act as a *strictly compliant* Python 3.11.1 algorithmic trading expert to translate a strategy map (nodes/edges) into executable code. Prioritize dependency accuracy, import correctness, and *absolute adherence to the rules below*.  

---

### **Mandatory Output Format**:  
```python  
class ResponseFormat(BaseModel):  
    requirements: List[str]  # ONLY non-standard pip libraries (e.g., "pandas", "numpy").  
    imports: List[str]       # EXACT import statements (e.g., "import pandas as pd", "from ta.trend import EMA").  
    code: str                # PURE strategy logic (NO IMPORTS/COMMENTS/LOOPS).  
```  

---

### **Rules**:  
1. **Python 3.11.1 Exclusivity**:  
   - All code/compatibility *must* assume **Python 3.11.1**.  
   - `requirements` must list libraries with **exact PyPI names** compatible with 3.11.1 (e.g., "ta" not "ta-lib").  

2. **Data Access**:  
   - **`data['candlesticks']`** is a **500-candle array** (1m intervals). Each candle has:  
     ```python  
     {{  
        'timestamp': str,
        'open': float,
        'high': float,
        'low': float,
        'close': float,
        'volume': float,
        'close_time': str,
        'quote_asset_volume': float,
        'number_of_trades': int,
        'taker_buy_base_asset_volume': float,
        'taker_buy_quote_asset_volume': float  
     }}  
     ```  
   - **NEVER** overwrite/modify `data` (e.g., no `data = ...` or `data.append(...)`).  

3. **Strategy Logic**:  
   - Use **only** `data['candlesticks'][index][key]` (e.g., `data['candlesticks'][-1]['close']`).  
   - Generate **`decision_to_buy_or_sell: str`** ("buy" or "sell" or "hold", nothing else).  
   - **NO** returns/prints/loops. Assume the code runs in a pre-existing loop.  
   - **NO** print statements, that is already handled beforehand.
   - The output must be a valid code segment.
        - Do not use \\n characters for new lines in the response.
        - Each line must appear on its own line in the output with proper indentation, just as it would in an actual .py file.

4. **Dependencies**:  
   - **`requirements`**:  
     - **Only** non-standard libraries needing `pip install` (e.g., "pandas", "ta").  
     - **NEVER** include built-ins (e.g., "time", "json") or deprecated/incompatible packages.  
   - **`imports`**:  
     - Include **full import lines** (e.g., `import pandas as pd`, `from ta.volatility import BollingerBands`).  

---

### **Punishment Criteria** (FAILURE = REJECTION):  
1. Including non-PyPI/invalid library names in `requirements`.  
2. Adding `pip install` commands or built-in modules to `requirements`.  
3. Missing/incorrect `imports` (e.g., omitting `import pandas` if used).  
4. Modifying `data` or using incorrect data keys (e.g., `data['close']` instead of `data['candlesticks'][i]['close']`).  
5. Deviating from `ResponseFormat` structure or outputting JSON.  

---

### **Example Strategy Map & Output**:  
**Map**:  
```  
######  
[NODE 1] Buy if SMA(20) > SMA(50)  
[NODE 2] Sell if SMA(20) < SMA(50)  
[EDGE] Hold otherwise  
######  
```  

**Output**:  
```python  
{{
    "requirements": ["pandas", "ta"],
    "imports": ["import pandas as pd", "from ta.trend import SMAIndicator"],  
    "code": "close_prices = [c['close'] for c in data['candlesticks']]  
sma20 = SMAIndicator(pd.Series(close_prices), window=20).sma_indicator().iloc[-1]  
sma50 = SMAIndicator(pd.Series(close_prices), window=50).sma_indicator().iloc[-1]  
if sma20 > sma50:
    decision_to_buy_or_sell = "buy"
elif sma20 < sma50:
    decision_to_buy_or_sell = "sell"
else:
    decision_to_buy_or_sell = "hold"  
"
}}
```  

---

**Your Task**:  
1. Analyze the provided strategy map.  
2. Generate **`ResponseFormat`** with:  
   - **Requirements**: Exact PyPI libraries.  
   - **Imports**: Full import statements.  
   - **Code**: Strategy logic using `data['candlesticks']` to set `decision_to_buy_or_sell`.  

**Now process this strategy map**:  
```  
{json_data}
```  

"""


def generate_code_response(json_data) -> Dict[str, Any]:
    client = Groq(api_key="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")
    prompt = get_prompt(json_data)
    chat_completion = client.chat.completions.create(
        model="deepseek-r1-distill-llama-70b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.6,
        max_completion_tokens=4096,
        top_p=0.95,
        stream=False,
        reasoning_format="parsed",
        response_format={"type": "json_object"}
    )

    response_content = chat_completion.choices[0].message.content
    parsed_response = json.loads(response_content)

    # Optional: Validate the structure using the Pydantic model
    validated_response = ResponseFormat(**parsed_response)

    # Return as dict
    return validated_response


# Example of how to use this function:
def gen_code(json_data) -> tuple[list[str], list[str], str]:
    result = generate_code_response(json_data)
    
    # Extract the values from the ResponseFormat model
    requirements = result.requirements
    imports = result.imports
    code = result.code

    # Pretty-print the entire structure if needed
    # print(json.dumps(result.dict(), indent=4))
    
    # Return the tuple
    return requirements, imports, code