import re

# Read the SQL file
with open('file-explorers.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all JSON strings in the INSERT statement
# Replace JavaScript-style properties with JSON properties
def fix_json(match):
    json_str = match.group(0)
    
    # Remove comments
    json_str = re.sub(r'//.*?$', '', json_str, flags=re.MULTILINE)
    
    # Replace undefined with null
    json_str = json_str.replace('undefined', 'null')
    
    # Fix property names - add quotes around unquoted keys
    # Match word characters followed by colon (but not already quoted)
    json_str = re.sub(r'(\n\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', json_str)
    
    # Remove trailing commas before closing brackets/braces
    json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
    
    return json_str

# Fix the INSERT VALUES section
content = re.sub(r"VALUES\s+\(.*?\);", fix_json, content, flags=re.DOTALL)

# Write the fixed content
with open('file-explorers-fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed SQL file created as file-explorers-fixed.sql")
