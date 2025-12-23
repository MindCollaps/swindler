import os

def sort_wordlists():
    wordlists_dir = os.path.join(os.path.dirname(__file__), 'wordlists')
    
    if not os.path.exists(wordlists_dir):
        print(f"Directory not found: {wordlists_dir}")
        return

    for filename in os.listdir(wordlists_dir):
        if filename.endswith(".txt"):
            filepath = os.path.join(wordlists_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                
                # Remove whitespace and filter empty lines
                lines = [line.strip() for line in lines if line.strip()]
                
                # Sort alphabetically, case-insensitive
                lines.sort(key=lambda s: s.lower())
                
                # Remove duplicates while preserving order (though sorting makes order predictable)
                # If we want to remove duplicates:
                lines = list(dict.fromkeys(lines))
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(lines) + '\n')
                
                print(f"Sorted: {filename}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    sort_wordlists()
