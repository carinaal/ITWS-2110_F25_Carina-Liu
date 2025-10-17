# Lab 4 – AI-Generated Weather + Activity Site

## Description
- **Primary API:** [OpenWeatherMap](https://openweathermap.org/api)  
- **Secondary API:** [BoredAPI](https://www.boredapi.com/api)  
- **Functionality:**  
  - Fetches and displays live weather (temperature, humidity, conditions, icons).  
  - Maps weather results to tailored activities (e.g., indoor for rain, outdoor for clear skies).  
  - Shows a subset of HTTP response headers for transparency.  
  - Weather-reactive background gradients.  
  - “Use My Location” and “Try Another” buttons for user interaction.  
  - Smooth fade-in transitions and polished UI styling.  


---


## Prompt Log (in order given)

1. "Create a weather app using the OpenWeatherMap API for Troy, NY in HTML, CSS, and JavaScript."  
2. "Add a second free API that provides activity suggestions — use BoredAPI."  
3. "Make the activity suggestions respond to the weather (e.g., indoor activities for rain)."  
4. "Fix the CORS error when fetching data from BoredAPI using a proxy fallback."  
5. "Display the weather data clearly in a card layout with temperature, humidity, and condition."  
6. "Add icons from the OpenWeatherMap API to show weather visually."  
7. "Include the HTTP response headers (like content-type and content-length) beneath the weather info."  
8. "Add a fade-in transition whenever the weather or activity data updates."  
9. "Improve the overall styling with rounded cards, subtle drop shadows, and gradient background."  
10. "Make the website background change colors depending on the weather condition."  
11. "Add a button that lets users use their current location instead of Troy, NY (+5 pts feature)."  
12. "Fix the layout so the weather and activity cards are side-by-side on large screens."  
13. "Make the 'Try another' button smaller and move it to the bottom-right corner of the activity card."  
14. "Increase the font sizes of the city name, weather condition, and badges to make them stand out more."  
15. "Add a soft fade-in and scale-up animation when new data loads."  
16. "Add weather-reactive emoji icons next to activity suggestions (e.g., ☔ for rain, ☀️ for clear skies)."  
17. "Improve the header title with gradient text and center alignment to make it more engaging."  
18. "Refine the activity card so the activity title is bold and the tags are styled as pill-shaped badges."  
19. "Ensure all code (HTML, CSS, JS) is fully AI-generated without manual edits."  
20. "Prepare the final version for Lab 4 submission following the assignment instructions."

---

## Limitations and Reflections on Using AI to Develop Lab 4
1. Initial setup: Describe how AI generated a working base but needed clarifying prompts.

2. Challenges:
• CORS issues with BoredAPI → needed proxy fallback.
• Style alignment took many prompts for AI to interpret properly.
• Difficulty with precise layout (e.g., moving buttons, balancing fonts).

3. Overcoming limitations:
• Used incremental prompts (“make card larger,” “add fade animation”).
• Tested code in VS Code and debugged with console errors fed back to AI.
• Ensured everything was AI-generated (no manual editing).

4. Reflection: While developing this project entirely through AI prompts, several limitations emerged. The AI occasionally produced code that didn’t run correctly on the first try, requiring follow-up prompts to fix issues such as CORS restrictions, asynchronous fetch errors, and styling misalignments. Designing the layout precisely as envisioned also took multiple iterations, since AI-generated CSS often required clarification or fine-tuning. Despite these challenges, I was able to guide the AI step-by-step to debug, improve visuals, and add features like fade animations and weather-reactive backgrounds. This process showed that while AI accelerates development, human direction and iterative problem-solving remain essential for creating polished, functional results.


---


## Citations
- [OpenWeatherMap API](https://openweathermap.org/api)  
- [BoredAPI](https://www.boredapi.com/api)  
- [Bootstrap Docs](https://getbootstrap.com/) (if used)  
- [All AI-generated code via ChatGPT (GPT-5)](https://chat.openai.com)
