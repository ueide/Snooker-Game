# Snooker-Game

## How To Play
- From the menu, choose **Single Player** or **Vs Cop**.
- If the cue ball is off the table or after a foul, place it inside the **D zone**.
- Move the mouse to aim (change the cue angle).
- Mouse press:
    - One click locks the cue tip (locks the aim).
    - Double click unlocks the cue tip (re-aim).
- Use the **shot power** slider on the left:
    - Drag down to increase power.
    - Release to take the shot.

## Game Modes (Single Player)
Press a key during play:
- **1: Standard** — Classic red triangle + colors on their spots.
- **2: Cluster** — Reds arranged in three small clusters.
- **3: Red Random** — Reds placed randomly; colors on their spots.
- **4: Full Random** — All balls placed randomly.
- **5: Menu** — Return to the main menu.

> Note: In **Vs Cop** mode, mode switching is disabled (only **5** to return to the menu works).


## Ball Points
Red             1 point
Yellow          2 points
Green           3 points
Brown           4 points
Blue            5 points
Pink            6 points
Black           7 points


## Rules
Phase 01: As long as there are red balls on the table.

Ball On             Next Ball
Red                 Colour
Colour              Red

*Colour: Yellow, Green, Brown, Blue, Pink and Black

Phase 02: No red balls on table
Ball Order: Yellow, Green, Brown, Blue, Pink and Black

## Vs Cop (AI) Mode
- The AI takes Player 2 turns automatically.
- The AI places the cue ball **intelligently** inside the D zone.
- The AI analyzes multiple angles and chooses shots based on:
    - Pocket proximity
    - Angle alignment to pockets
    - Distance to the target ball
    - Path complexity (cushion bounces)
    - Table position advantage
- Foul points are awarded to the opponent (standard snooker rules).


## Fouls
Action                                                  Penalty
Don't hit any ball                                      -4
First hit a colour ball instead of the Red Ball         -4, -5 (blue), -6 (pink), -7(black)
First hit a red ball instead of the colour Ball         -4
Potted a different ball that Ball On                    -4, -5 (blue), -6 (pink), -7(black)
Potted two colour ball in the same time                 Lost the value of the biggest ball

