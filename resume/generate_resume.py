#!/usr/bin/env python3
"""
Generate Adam Rotmil's resume as a two-page PDF.
Typography: DM Sans as placeholder (swap in Illustrator later).
Layout: Two-column (dates | content) with teal accent dividers.
Designed for easy editing in Illustrator — simple text boxes, no complex nesting.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# ── Colors ──
TEAL = HexColor("#55C2C3")
BLACK = HexColor("#1A1A1A")
GRAY = HexColor("#666666")
LIGHT_GRAY = HexColor("#999999")
WHITE = HexColor("#FFFFFF")

# ── Layout ──
PAGE_W, PAGE_H = letter  # 612 x 792
MARGIN_L = 54
MARGIN_R = 54
MARGIN_T = 52
MARGIN_B = 52
DATE_COL_W = 78
GAP = 18
CONTENT_X = MARGIN_L + DATE_COL_W + GAP
CONTENT_W = PAGE_W - CONTENT_X - MARGIN_R

# ── Font setup ──
# Try to register DM Sans if available, otherwise fall back to Helvetica
FONT = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_LIGHT = "Helvetica"  # Helvetica doesn't have a light; we'll use regular
FONT_MEDIUM = "Helvetica"

# Try to find DM Sans on the system
dm_sans_paths = [
    os.path.expanduser("~/Library/Fonts/DMSans-Regular.ttf"),
    "/Library/Fonts/DMSans-Regular.ttf",
    "/System/Library/Fonts/DMSans-Regular.ttf",
]
for p in dm_sans_paths:
    if os.path.exists(p):
        base = os.path.dirname(p)
        try:
            pdfmetrics.registerFont(TTFont("DMSans", os.path.join(base, "DMSans-Regular.ttf")))
            pdfmetrics.registerFont(TTFont("DMSans-Bold", os.path.join(base, "DMSans-Bold.ttf")))
            pdfmetrics.registerFont(TTFont("DMSans-Medium", os.path.join(base, "DMSans-Medium.ttf")))
            pdfmetrics.registerFont(TTFont("DMSans-Light", os.path.join(base, "DMSans-Light.ttf")))
            FONT = "DMSans"
            FONT_BOLD = "DMSans-Bold"
            FONT_MEDIUM = "DMSans-Medium"
            FONT_LIGHT = "DMSans-Light"
            print("Using DM Sans")
        except Exception:
            pass
        break

if FONT == "Helvetica":
    print("DM Sans not found — using Helvetica as placeholder. Swap typeface in Illustrator.")


class ResumeBuilder:
    def __init__(self, filename):
        self.c = canvas.Canvas(filename, pagesize=letter)
        self.y = PAGE_H - MARGIN_T
        self.page = 1

    def check_space(self, needed):
        """Start new page if not enough space."""
        if self.y - needed < MARGIN_B:
            self.c.showPage()
            self.page += 1
            self.y = PAGE_H - MARGIN_T

    def draw_text(self, x, y, text, font=None, size=10, color=BLACK, max_width=None):
        """Draw a single line of text. Returns the text object for Illustrator editing."""
        self.c.setFont(font or FONT, size)
        self.c.setFillColor(color)
        if max_width:
            self.c.drawString(x, y, text)
        else:
            self.c.drawString(x, y, text)

    def draw_wrapped_text(self, x, y, text, font=None, size=10, color=BLACK, max_width=CONTENT_W, leading=None):
        """Draw text that wraps within max_width. Returns final y position."""
        if leading is None:
            leading = size * 1.45
        self.c.setFont(font or FONT, size)
        self.c.setFillColor(color)

        words = text.split()
        lines = []
        current_line = ""

        for word in words:
            test = current_line + (" " if current_line else "") + word
            w = pdfmetrics.stringWidth(test, font or FONT, size)
            if w > max_width and current_line:
                lines.append(current_line)
                current_line = word
            else:
                current_line = test
        if current_line:
            lines.append(current_line)

        for line in lines:
            self.c.drawString(x, y, line)
            y -= leading

        return y

    def draw_header(self):
        """Draw name, title, contact, portfolio link."""
        y = self.y

        # Name
        self.c.setFont(FONT_MEDIUM or FONT, 20)
        self.c.setFillColor(BLACK)
        self.c.drawString(MARGIN_L, y, "Adam Rotmil, B.F.A.")
        y -= 22

        # Title
        self.c.setFont(FONT_LIGHT or FONT, 20)
        self.c.drawString(MARGIN_L, y, "Product Designer")
        y -= 20

        # Contact
        self.c.setFont(FONT, 9)
        self.c.setFillColor(GRAY)
        self.c.drawString(MARGIN_L, y, "Silver Spring, MD  ·  adam.rotmil@gmail.com")
        y -= 13

        # Portfolio link
        self.c.setFont(FONT_MEDIUM or FONT, 9)
        self.c.setFillColor(TEAL)
        self.c.drawString(MARGIN_L, y, "View Portfolio ↗")
        link_w = pdfmetrics.stringWidth("View Portfolio ↗", FONT_MEDIUM or FONT, 9)
        # Teal underline
        self.c.setStrokeColor(TEAL)
        self.c.setLineWidth(0.5)
        self.c.line(MARGIN_L, y - 1.5, MARGIN_L + link_w, y - 1.5)
        y -= 18

        self.y = y

    def draw_summary(self, text):
        """Draw the summary paragraph."""
        self.y = self.draw_wrapped_text(
            MARGIN_L, self.y, text,
            font=FONT, size=9, color=GRAY,
            max_width=PAGE_W - MARGIN_L - MARGIN_R, leading=13.5
        )
        self.y -= 8

    def draw_section_header(self, title):
        """Draw section header with teal divider."""
        self.check_space(30)

        self.c.setFont(FONT_MEDIUM or FONT, 11)
        self.c.setFillColor(BLACK)
        self.c.drawString(MARGIN_L, self.y, title)
        self.y -= 8

        # Teal line
        self.c.setStrokeColor(TEAL)
        self.c.setLineWidth(1.5)
        self.c.line(MARGIN_L, self.y, PAGE_W - MARGIN_R, self.y)
        self.y -= 14

    def draw_job(self, dates, role, company, bullets):
        """Draw a job entry with dates on the left and content on the right."""
        # Estimate space needed
        est_lines = 2  # role line
        for b in bullets:
            words = b.split()
            est_w = pdfmetrics.stringWidth(b, FONT, 8.5)
            est_lines += max(1, int(est_w / CONTENT_W) + 1)
        est_height = est_lines * 12.5 + 10
        self.check_space(est_height)

        start_y = self.y

        # Date (left column)
        self.c.setFont(FONT, 9)
        self.c.setFillColor(GRAY)
        self.c.drawString(MARGIN_L, self.y, dates)

        # Role · Company (right column)
        role_text = role + "  ·  "
        role_w = pdfmetrics.stringWidth(role_text, FONT, 10)

        self.c.setFont(FONT, 10)
        self.c.setFillColor(BLACK)
        self.c.drawString(CONTENT_X, self.y, role_text)

        self.c.setFont(FONT_BOLD, 10)
        self.c.drawString(CONTENT_X + role_w, self.y, company)
        self.y -= 16

        # Bullets
        for b in bullets:
            bullet_text = "•  " + b
            self.y = self.draw_wrapped_text(
                CONTENT_X, self.y, bullet_text,
                font=FONT, size=8.5, color=GRAY,
                max_width=CONTENT_W, leading=12.5
            )
            self.y -= 1  # small gap between bullets

        self.y -= 6  # gap after job

    def draw_education_line(self, degree, school):
        """Draw an education entry."""
        self.check_space(16)
        text = degree + "  ·  "
        deg_w = pdfmetrics.stringWidth(text, FONT, 10)

        self.c.setFont(FONT, 10)
        self.c.setFillColor(BLACK)
        self.c.drawString(CONTENT_X, self.y, text)

        self.c.setFont(FONT_BOLD, 10)
        self.c.drawString(CONTENT_X + deg_w, self.y, school)
        self.y -= 16

    def save(self):
        self.c.save()


def main():
    out_path = os.path.join(os.path.dirname(__file__), "Adam-Rotmil-Resume.pdf")
    r = ResumeBuilder(out_path)

    # ── HEADER ──
    r.draw_header()

    # ── SUMMARY ──
    r.draw_summary(
        "I lead product design and design systems at a startup, working on AI agents for advertising. "
        "I've also designed for finance, healthcare and defense. Security highlights include work with "
        "the Army Futures and Concepts Center to prepare for AI and quantum in 2040; work the U.S. "
        "Special Operations Command to foster deep tech innovation and capabilities development; and "
        "designing a learning management system for U.S. Cyber Command to train security specialists "
        "in offense and defense roles."
    )

    # ── EXPERIENCE ──
    r.draw_section_header("Experience")

    r.draw_job("2024 – Present", "Design Lead, Core Product — Agentic AI", "Clarvos", [
        "Owning end-to-end design for an agentic advertising platform that runs campaigns, generates creatives, and optimizes ad spend. Shipped founding MVP including full design system in first sprints in deep collaboration with 30 engineers, 8 PMs, and the founding team.",
        "Leading 0-to-1 discovery, prototyping, and design system work. Running experiments with AI designers to define product–market fit and differentiation across AI surfaces and agentic workflows.",
        "Delivered full rebrand with the GTM team: rebuilt the design system and redesigned the entire application in a rapid sprint for a successful launch out of stealth.",
        "Guide the digital creative studio producing image and video ad campaigns for Meta, TikTok, YouTube, Reddit, CTV, and native advertising.",
        "Oversee and guide the work of 2 product designers, elevating process and craft quality.",
        "Winner: Top 3 Employees Company Innovation Merit Award, 2025.",
    ])

    r.draw_job("2023 – 2024", "Senior Product Designer", "Cylitix — U.S. Special Operations Command", [
        "Lead designer for a platform connecting tech scouts with VC-backed innovators, bridging public–private funding across a $3B+ ecosystem.",
        "Designed LLM-powered features scaling to a 45,000+ user base.",
        "Built a scalable Figma design system to optimize velocity and shipping cadence.",
        "Ran cross-functional workshops to align leadership, product, and AI teams.",
    ])

    r.draw_job("2022 – 2023", "Product Design Lead", "Toptal", [
        "Selected to the top 3% of global design talent through Toptal's screening process.",
        "Led 0-to-1 design of Respond AI, an LLM-powered supply-chain logistics app that cut driver wait times by over 90%, with a TAM in the tens of billions.",
        "Built and scaled a Figma design system across the org, driving consistency and velocity. Invited to design multiple enterprise applications as a result.",
        "Designed an innovative clinical trial platform now in use at Yale University, and a training environment for U.S. Cyber Command.",
        "Led discovery sprints for Wild Brains, a brain–computer interface, including market research and a Figma prototype used by co-founders to pitch investors.",
    ])

    r.draw_job("2020 – 2022", "Product Discovery and Design Lead", "AstraZeneca", [
        "Led product design for Care, a platform for running clinical trials on cutting-edge therapies that helped modernize cancer research.",
        "Conducted 100+ UX research interviews with patients, clinicians, and caregivers to inform product–market fit and validate interaction models.",
    ])

    r.draw_job("2018 – 2020", "Studio Craft Lead, Interaction Design", "Fjord Accenture", [
        "Led the redesign of the U.S. Citizenship & Immigration system used by 5,000+ adjudicators processing over 35,000 applications daily.",
        "Helped scale the DC studio from 40 to 150+ designers; mentored over 70 designers across engineering, product, and leadership.",
        "Co-led Futures & Concepts Center design for Army Futures Command, aligning 1,000+ personnel for AI and quantum computing readiness in 2040.",
    ])

    r.draw_job("2017 – 2018", "UX Design Lead and Senior Manager", "T. Rowe Price", [
        "Led the retail investment team in redesigning the 401(k) customer experience. Managed a team of 5 designers.",
        "Doubled customer retention by designing a mechanism for customers to rebuild contributions after short-term financial needs.",
        "Transitioned customers from phone to digital, enabling the transfer of 500+ FTE employees to more rewarding roles and closing an unneeded office.",
    ])

    r.draw_job("2016", "Product Designer", "Perfecta", [
        "Led product discovery and design for cybersecurity software supporting special operators.",
        "Worked directly with CEO and GTM team on prototypes and growth.",
    ])

    r.draw_job("2018 – 2020", "Design Faculty", "Maryland Institute College of Art", [
        "Taught graduate-level UX and Product Design.",
    ])

    # ── AI MODEL EVALUATION ──
    r.draw_section_header("AI Model Evaluation")

    r.draw_job("2023 – Present", "Contributor — RLHF & Model Evaluation", "DataAnnotation (OpenAI, Google, Anthropic)", [
        "Evaluate and rate model outputs across multi-axis quality frameworks: instruction following, factuality, completeness, conciseness, and safety — for frontier models including ChatGPT and Google Gemini.",
        "Contribute to SFT and RLHF training data used by models shipped to hundreds of millions of users.",
        "Serve in a quality assurance role reviewing other evaluators' ratings for consistency, accuracy, and rubric adherence. Helping maintain the integrity of the training data pipeline.",
    ])

    # ── EDUCATION ──
    r.draw_section_header("Education")

    r.draw_education_line("B.F.A. in Design", "The Art Institute of Boston")
    r.draw_education_line("Guest Student", "The Basel School of Design")

    # Save
    r.save()
    print(f"\nResume generated: {out_path}")
    print(f"Pages: {r.page}")


if __name__ == "__main__":
    main()
