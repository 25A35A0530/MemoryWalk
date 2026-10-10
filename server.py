from http.server import SimpleHTTPRequestHandler, HTTPServer
import json
import urllib.request
import urllib.error


# =========================================
# OLLAMA SETTINGS
# =========================================

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5-coder:3b"


# =========================================
# ASK OLLAMA
# =========================================

def ask_ollama(prompt):

    data = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False
    }

    request = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json"
        }
    )

    try:

        with urllib.request.urlopen(
            request,
            timeout=120
        ) as response:

            result = json.loads(
                response.read().decode("utf-8")
            )

        return result["response"]

    except urllib.error.URLError as e:

        raise Exception(
            "Could not connect to Ollama: "
            + str(e)
        )


# =========================================
# EXTRACT JSON FROM OLLAMA RESPONSE
# =========================================

def extract_json(response):

    response = response.replace(
        "```json",
        ""
    )

    response = response.replace(
        "```",
        ""
    )

    response = response.strip()

    # Try direct JSON first

    try:

        return json.loads(response)

    except json.JSONDecodeError:

        pass

    # Find JSON object inside extra text

    start = response.find("{")
    end = response.rfind("}")

    if start != -1 and end != -1:

        json_text = response[
            start:end + 1
        ]

        return json.loads(json_text)

    raise Exception(
        "Ollama returned an invalid "
        "JSON response:\n\n"
        + response
    )


# =========================================
# HTTP HANDLER
# =========================================

class Handler(SimpleHTTPRequestHandler):


    # =====================================
    # POST ROUTER
    # =====================================

    def do_POST(self):

        if self.path == "/generate-mission":

            self.generate_mission()

            return

        if self.path == "/generate-reflection":

            self.generate_reflection()

            return

        if self.path == "/evaluate-reflection":

            self.evaluate_reflection()

            return

        self.send_error(404)


    # =====================================
    # READ JSON REQUEST BODY
    # =====================================

    def read_json_body(self):

        length = int(
            self.headers.get(
                "Content-Length",
                0
            )
        )

        body = self.rfile.read(length)

        return json.loads(body)


    # =====================================
    # GENERATE MISSION
    # =====================================

    def generate_mission(self):

        try:

            data = self.read_json_body()

            duration = data.get(
                "duration",
                15
            )

            focus = data.get(
                "focus",
                "surprise"
            )

            focus_instructions = {

                "nature":
                    """
Focus strongly on plants, trees,
sky, sunlight, natural textures,
insects, weather, shadows, or
other safe natural details.
""",

                "sounds":
                    """
Focus strongly on listening:
nearby sounds, distant sounds,
rhythm, silence, unexpected sounds,
changes in volume, or layers of sound.
""",

                "details":
                    """
Focus strongly on tiny visual details
that people normally walk past without
noticing: textures, shapes, patterns,
small movements, reflections, or colors.
""",

                "surprise":
                    """
Choose an unexpected and creative
observation theme yourself.
"""

            }

            focus_instruction = focus_instructions.get(
                focus,
                focus_instructions["surprise"]
            )

            prompt = f"""

You are the AI engine for an application
called MemoryWalk.

MemoryWalk helps people leave their screens
and pay attention to the real world.

Create ONE unique outdoor observation mission
for {duration} minutes.

The user's chosen observation focus is:

{focus_instruction}

The mission should feel personal,
interesting, specific and slightly playful.

The person will read the mission,
put their phone away,
and experience the real world.

IMPORTANT RULES:

- The person must physically go outside.
- They should NOT need their phone during the activity.
- Do NOT require photographs.
- Do NOT require GPS.
- Do NOT require internet.
- Do NOT require special equipment.
- Do NOT ask them to approach strangers.
- Keep the activity safe.
- Encourage observation rather than achievement.
- Do not make it feel like exercise or homework.
- Make it possible in an ordinary neighborhood,
  street, garden, park, balcony, or outdoor area.
- Give the person something specific to notice.
- Avoid generic instructions such as simply
  "look around and notice nature."
- The mission must fit within {duration} minutes.
- Do not tell the person to use their phone.

Return ONLY this JSON object:

{{
    "title": "short creative mission title",
    "mission": "clear instructions for the outdoor activity",
    "duration": {duration}
}}

Do not write anything before or after the JSON.
Do not use Markdown.

"""

            print()
            print("Generating personalized mission...")
            print("Duration:", duration, "minutes")
            print("Focus:", focus)

            raw_response = ask_ollama(prompt)

            print()
            print("RAW MISSION RESPONSE:")
            print(raw_response)
            print()

            mission = extract_json(
                raw_response
            )

            self.send_json({
                "success": True,
                "mission": mission
            })

        except Exception as e:

            print()
            print("MISSION ERROR:")
            print(str(e))
            print()

            self.send_json({
                "success": False,
                "error": str(e)
            })


    # =====================================
    # GENERATE REFLECTION QUESTIONS
    # =====================================

    def generate_reflection(self):

        try:

            data = self.read_json_body()

            title = data.get(
                "title",
                ""
            )

            mission = data.get(
                "mission",
                ""
            )

            focus = data.get(
                "focus",
                "surprise"
            )

            prompt = f"""

You are the reflection assistant
for an application called MemoryWalk.

A person has just completed an outdoor
observation mission and returned to the app.

MISSION TITLE:
{title}

MISSION:
{mission}

FOCUS:
{focus}

Create exactly FOUR thoughtful reflection
questions based specifically on this mission.

The questions should help the person remember
what they actually experienced outside.

IMPORTANT:

- Questions must relate directly to the mission.
- Do not ask generic life-coaching questions.
- Do not ask for a score.
- Do not ask for photographs.
- Do not require factual knowledge.
- Keep questions simple and natural.
- Encourage specific memories and observations.
- Make every question different.
- Avoid yes/no questions.
- The questions should be answerable from memory.
- Do not repeat the same generic question.

If the mission is about sounds:
- Ask about specific sounds.
- Ask about distance, rhythm, silence,
  layers, changes, or unexpected sounds.

If the mission is about nature:
- Ask about specific natural details,
  patterns, movement, light, or texture.

If the mission is about tiny details:
- Ask about specific visual details,
  shapes, textures, colors, patterns,
  or small movements.

Return ONLY this JSON:

{{
    "questions": [
        "question 1",
        "question 2",
        "question 3",
        "question 4"
    ]
}}

Do not write anything before or after the JSON.
Do not use Markdown.

"""

            print()
            print("Generating reflection questions...")
            print("Mission:", title)

            raw_response = ask_ollama(prompt)

            print()
            print("RAW REFLECTION RESPONSE:")
            print(raw_response)
            print()

            reflection = extract_json(
                raw_response
            )

            self.send_json({
                "success": True,
                "reflection": reflection
            })

        except Exception as e:

            print()
            print("REFLECTION ERROR:")
            print(str(e))
            print()

            self.send_json({
                "success": False,
                "error": str(e)
            })


    # =====================================
    # EVALUATE REFLECTION
    # =====================================

    def evaluate_reflection(self):

        try:

            data = self.read_json_body()

            title = data.get(
                "title",
                ""
            )

            mission = data.get(
                "mission",
                ""
            )

            focus = data.get(
                "focus",
                "surprise"
            )

            questions = data.get(
                "questions",
                []
            )

            answers = data.get(
                "answers",
                []
            )

            # Combine questions and answers

            reflection_text = ""

            for index in range(
                min(
                    len(questions),
                    len(answers)
                )
            ):

                question = questions[index]

                answer = answers[index]

                reflection_text += (
                    f"\nQuestion {index + 1}: "
                    f"{question}\n"
                    f"Answer {index + 1}: "
                    f"{answer}\n"
                )

            prompt = f"""

You are the thoughtful AI evaluator
for an application called MemoryWalk.

The purpose of MemoryWalk is NOT to test
the person or judge whether they completed
an activity correctly.

Instead, help the person understand what
they noticed during their time outside.

MISSION TITLE:
{title}

MISSION:
{mission}

FOCUS:
{focus}

THEIR REFLECTION:
{reflection_text}

Analyze the reflection.

Give a gentle observation score from 0 to 100.

The score should represent how meaningfully
the person described their real-world
observation, not whether their answers
were correct.

A short reflection can still receive a
good score if it contains a specific,
genuine observation.

Create:

1. A short title for the result.
2. A thoughtful paragraph about what they
   noticed.
3. A personal takeaway.
4. A score from 0 to 100.

IMPORTANT:

- Do not shame the person.
- Do not say they failed.
- Do not invent things they did not mention.
- Do not claim to know their emotions unless
  their reflection supports it.
- Do not give medical or psychological advice.
- Keep the tone warm, human and reflective.
- Encourage future observation.
- Make the feedback specific to their answers.
- Do not use generic motivational language
  if the reflection contains specific details.

Return ONLY this JSON:

{{
    "title": "short result title",
    "score": 0,
    "feedback": "thoughtful feedback based on the reflection",
    "takeaway": "one personal takeaway for the person"
}}

Do not write anything before or after the JSON.
Do not use Markdown.

"""

            print()
            print("Evaluating reflection...")

            raw_response = ask_ollama(prompt)

            print()
            print("RAW EVALUATION RESPONSE:")
            print(raw_response)
            print()

            evaluation = extract_json(
                raw_response
            )

            # Keep score between 0 and 100

            try:

                evaluation["score"] = max(
                    0,
                    min(
                        100,
                        int(
                            evaluation.get(
                                "score",
                                0
                            )
                        )
                    )
                )

            except Exception:

                evaluation["score"] = 0

            self.send_json({
                "success": True,
                "evaluation": evaluation
            })

        except Exception as e:

            print()
            print("EVALUATION ERROR:")
            print(str(e))
            print()

            self.send_json({
                "success": False,
                "error": str(e)
            })


    # =====================================
    # SEND JSON RESPONSE
    # =====================================

    def send_json(self, data):

        response = json.dumps(
            data
        ).encode(
            "utf-8"
        )

        self.send_response(200)

        self.send_header(
            "Content-Type",
            "application/json"
        )

        self.send_header(
            "Cache-Control",
            "no-cache"
        )

        self.send_header(
            "Content-Length",
            str(len(response))
        )

        self.end_headers()

        self.wfile.write(
            response
        )


# =========================================
# START SERVER
# =========================================

server = HTTPServer(
    ("localhost", 8000),
    Handler
)


print("===================================")
print("        MEMORYWALK is running")
print("===================================")
print("Open: http://localhost:8000")
print("Using Ollama:", MODEL)
print()
print("Endpoints:")
print("  /generate-mission")
print("  /generate-reflection")
print("  /evaluate-reflection")
print()
print("Press CTRL+C to stop.")
print("===================================")
print()


server.serve_forever()