import os

search_dir = r"c:\Users\Vasanth\Desktop\PrepareForU"
fonts = ["cinzel", "syne", "poppins", "dm sans", "inter", "outfit", "eb garamond", "vend sans"]

extensions = (".ts", ".tsx", ".css", ".html", ".js", ".jsx")

results = []

for root, dirs, files in os.walk(search_dir):
    if "node_modules" in root or "dist" in root or ".git" in root or "brain" in root:
        continue
    for file in files:
        if file.endswith(extensions):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    content_lower = content.lower()
                    for font in fonts:
                        if font in content_lower:
                            # find line number
                            lines = content.splitlines()
                            for i, line in enumerate(lines):
                                if font in line.lower():
                                    results.append(f"{path}:{i+1}: {line.strip()}")
            except Exception as e:
                pass

print(f"Found {len(results)} matches:")
for r in results:
    print(r)
