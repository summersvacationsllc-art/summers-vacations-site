c = open("/Users/briansummers/projects/summers-vacations-site/src/app/guidebook/[property]/page.tsx").read()

# Ozarks Lake Summer — aggressive cleanup of ALL remaining warm colors
# Replace mode toggle bar background
c = c.replace("background: '#3d2b1f'", "background: '#0c4a6e'")

# Replace 🌲 fir tree emoji with lake/ocean/sun emojis
c = c.replace("🌲 Branson Mode", "🌊 Branson Mode")
c = c.replaceAll("🌲", "🌊")  # All remaining fir trees become waves

# Fix door code colors — brown to blue
c = c.replace("color: '#2c1810'", "color: '#0c4a6e'")
c = c.replace("color: '#78350f'", "color: '#0ea5e9'")

# Replace yellow info boxes with teal
c = c.replace("bg-yellow-50", "bg-teal-50")
c = c.replace("bg-yellow-100", "bg-teal-100")
c = c.replace("border-yellow-200", "border-teal-200")
c = c.replace("border-yellow-300", "border-teal-300")
c = c.replace("text-yellow-800", "text-teal-800")
c = c.replace("text-yellow-700", "text-teal-700")
c = c.replace("text-yellow-600", "text-teal-600")
c = c.replace("text-yellow-200", "text-sky-200")

# Amber borders
c = c.replace("border-amber-400", "border-sky-400")
c = c.replace("border-amber-300", "border-sky-300")
c = c.replace("border-amber-200", "border-sky-200")
c = c.replace("border-amber-100", "border-sky-100")

# Amber text
c = c.replace("text-amber-900", "text-sky-900")
c = c.replace("text-amber-800", "text-sky-800")
c = c.replace("text-amber-700", "text-sky-700")
c = c.replace("text-amber-600", "text-sky-600")
c = c.replace("text-amber-500", "text-sky-500")
c = c.replace("text-amber-400", "text-sky-400")
c = c.replace("text-amber-300", "text-yellow-300")  # Header titles stay yellow
c = c.replace("text-amber-200", "text-sky-200")
c = c.replace("text-amber-100", "text-sky-100")
c = c.replace("text-amber-50", "text-sky-50")

# Amber backgrounds
c = c.replace("bg-amber-50", "bg-sky-50")
c = c.replace("bg-amber-100", "bg-sky-100")
c = c.replace("bg-amber-200", "bg-sky-200")

# But keep header titles bright yellow
c = c.replace("text-sky-300", "text-yellow-300")  # restore header titles
c = c.replace("text-sky-800", "text-sky-800")  # already correct

# Report card gradient
c = c.replace("linear-gradient(135deg,#fef3c7,#fde68a)", "linear-gradient(135deg,#e0f2fe,#bae6fd)")

# Green text for "stay ended" — change to teal
c = c.replace("text-green-700", "text-teal-700")
c = c.replace("text-green-600", "text-teal-600")

# Adventure section yellow tip
c = c.replace("text-yellow-200", "text-sky-200")

# Show tags
c = c.replace("bg-yellow-50 text-yellow-700", "bg-teal-50 text-teal-700")

open("/Users/briansummers/projects/summers-vacations-site/src/app/guidebook/[property]/page.tsx","w").write(c)
print("DONE")