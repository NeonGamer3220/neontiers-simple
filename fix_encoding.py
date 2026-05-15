import sys
p = 'app/page.js'
with open(p, 'rb') as f:
    buf = f.read()
bad = bytes([0xE2, 0x94, 0x9C, 0xC4, 0xBE])
good = b'\xC3\x96'
count = buf.count(bad)
print(f"Found {count} replacements")
result = buf.replace(bad, good)
with open(p, 'wb') as f:
    f.write(result)
print("Done")
