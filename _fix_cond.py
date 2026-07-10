content = open("/Users/briansummers/projects/summers-vacations-site/src/app/guidebook/[property]/page.tsx").read()

# Fix all Notch-only sections properly - one by one
sections = [
    ("Pool & Pavilion Rules", "isNotch && "),
    ("Outdoor Recreation", "isNotch && "),
    ("BBQ Grill", "isNotch && "),
    ("Coin Laundry", "isNotch && "),
]

for name, prefix in sections:
    # Find the section and add conditional
    marker = f"{{guideItem('#"
    # Find the right occurrence
    idx = 0
    while True:
        idx = content.find(marker, idx)
        if idx < 0:
            break
        # Check if this guideItem contains our section name
        end = content.find(")}", idx)
        if end < 0:
            break
        snippet = content[idx:end]
        if name in snippet and "isNotch" not in snippet[:20] and "isPenthouse" not in snippet[:20]:
            # This is the one - wrap it
            content = content[:idx] + "{" + prefix + content[idx:]
            print(f"Wrapped: {name}")
            break
        idx = end

# Add Haven community and in-unit sections
# The Haven community section should appear where "Outdoor Recreation" would be for Notch
old_outdoor_guideitem = "{isNotch && guideItem('#d1fae5','🌿','Outdoor Recreation'"

haven_community = """{isNotch && guideItem('#d1fae5','🌿','Outdoor Recreation'
# Find and insert Haven section right after the closing of the Notch Outdoor section
# Actually, let me add it as an additional conditional rendering block

# Find the Notch outdoor recreation block end
recreation_end = "</div></span>')}"

idx = content.find(old_outdoor_guideitem)
if idx > 0:
    # Find the end of this guideItem call
    end = content.find(recreation_end, idx)
    if end > 0:
        end += len(recreation_end)
        haven_block = """{isHaven && guideItem('#d1fae5','🏊','Community Amenities','2 pools, hot tub & playground','<strong>🏊 Pools &amp; Hot Tub:</strong> 2 shared community pools and a hot tub are available for guest use. Please follow posted rules and hours.<br><br><strong>🛝 Playground:</strong> Community playground for children. Adult supervision required.<br><br><strong>🚤 Boat & Trailer Parking:</strong> Designated parking in the upper lot by the blue shed.')}"""
        content = content[:end] + "\n                  " + haven_block + content[end:]
        print("Added Haven community block")

# Add Haven in-unit section after Notch coin laundry
old_coin = "{isNotch && guideItem('#e0f2fe','🪙','Coin Laundry'"
idx = content.find(old_coin)
if idx > 0:
    end = content.find(recreation_end, idx)
    if end > 0:
        end += len(recreation_end)
        haven_laundry = """{isHaven && guideItem('#e0f2fe','🏠','In-Unit Amenities','Washer, dryer & appliances','<strong>🧺 Washer &amp; Dryer:</strong> Full-size in-unit — no quarters needed!<br><br><strong>🍳 Whirlpool Range:</strong> Electric range with cooktop.<br><br><strong>🧼 Dishwasher:</strong> In the kitchen. Please start before checkout.<br><br><strong>📡 Microwave:</strong> Above the range.<br><br><strong>💡 Dimmer Lights:</strong> Can lights downstairs are dimmable — look for the switches on the wall.')}"""
        content = content[:end] + "\n                  " + haven_laundry + content[end:]
        print("Added Haven in-unit block")

open("/Users/briansummers/projects/summers-vacations-site/src/app/guidebook/[property]/page.tsx","w").write(content)
print("\nDONE")
