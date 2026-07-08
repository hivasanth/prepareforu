import json
import os

log_file = r"C:\Users\Vasanth\.gemini\antigravity-ide\brain\1ec75044-6ea7-4580-9f6e-524457d7dfab\.system_generated\logs\transcript_full.jsonl"
output_file = r"c:\Users\Vasanth\Desktop\PrepareForU\scratch\user_requests_all.txt"

with open(log_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

out_content = []
for i, line in enumerate(lines):
    try:
        obj = json.loads(line)
        if obj.get("type") == "USER_INPUT":
            out_content.append(f"=== STEP {obj.get('step_index')} ===")
            out_content.append(obj.get("content"))
            out_content.append("\n" + "="*50 + "\n")
    except Exception as e:
        print(f"Error parsing line {i}: {e}")

with open(output_file, 'w', encoding='utf-8') as f_out:
    f_out.write("\n".join(out_content))

print(f"Successfully wrote user requests to {output_file}")
