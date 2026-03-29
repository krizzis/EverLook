## Overview: 

is SillyTavern extension that tracks and maintains the current scene state of a single active character during a chat session. 

The extension automatically analyzes chat turn pairs composed of the latest user message and the responding character message, extracts structured scene attributes like character outfit, pose, emotion and also current location, and uses this data to: 

* Maintain up-to-date scene context
* Dynamically update chat background based on location
* Provide input for image generation via the native SillyTavern pipeline (e.g., ComfyUI)

---

## User scenario: 

1. User starts a chat
2. EverLook initialize starting scene state
3. User send a message to chat
4. EverLook inject current scene state into chat context before user message
5. character (PR-LLM) respond to user message
6. EverLook analyze turn-pair (user message + character response) and update scene state if needed
7. User initiate image generation via the native SillyTavern pipeline (e.g., ComfyUI)
8. EverLook create deteremenistic prompt for image generation based on scene state attributes and send prompt to image generation pipeline

---

## Functional requirements:

### Scene state attributes:

### On root level
- ChatId (for multichat logic)
- Character Name (cannot be changed) - from Character Card
- Character Lora (cannot be changed) - from Character Card

#### Appearance
1. Initialized once on chat start
2. Never changes during chat
3. Extracted from SillyTavern Character card

#### Pose
1. Initialized on chat start from scenario and/or character first message
2. Single string value
3. Normalized to predefined list value
4. No attributes

#### Emotion
1. Initialized on chat start from scenario and/or character first message
2. Single string value
3. Normalized to predefined list value
4. No attributes

#### Location
1. Initialized on chat start from scenario and/or character first message
2. Single object with:
    * name - string
    * daytime - string (day (default), night, evening, morning, sunset, sunrise, dawn, dusk)
    * weather - string (clear (default), sunny, cloudy, rainy, snowy, foggy, windy, stormy)

#### Action
1. Initialized on chat start from scenario and/or character first message
2. Single object with:
    * name - string (Normalized to predefined list value)
    * interaction - boolean (true if character is interacting with user, false otherwise)

#### Outfit
1. Initialized on chat start from Character Card
2. Array of strings (normalized values)
3. states of nudity (e.g. 'topless', 'nude', 'bare feet' should also be threated as part of 'outfit')
4. Empty or null value should be threated as 'completly nude' in terms of prompt generation
4. Attribute structure is subject of change during development process!

### Dynamic background set

1. When location attribute is changed: 
- EverLook perform search in background folder for files with name containing location name, daytime and weater: 
    - If nothing found repeat search for combination of name and daytime
    - If still nothing found narrow search to only location name
- If one file is found, EverLook set is as background for chat (use first one in case of multiple findings)
- If no files are found then skip background change
    
### Tech-LLM 

Tech-LLM can be the same LLM as RP-LLM (with overridden system promps) or separate LLM (can be setup in config or extension settings)

### State tracking 

- After respond of RP-LLM, EverLook send silent prompt to Tech-LLM to tracked attributes from turn-pair (user message + character response)
- Tech-LLM return only changed attributes with confidence level
- EverLook update scene state attributes if confidence level is above threshold (configured)
- All changes should be logged

### Prompt generation

When user requrest image generation via the native SillyTavern pipeline (e.g., ComfyUI):
- EverLook create prompt for SD model based on scene tracker data
- All attributes should be normilized to danbooru style tags. 
- Order of tags in prompt is following: 
    1. Subject: if action.interaction = true then "1girl", else "1girl, solo"
    2. Appearance
    3. Pose
    4. Outfit
    5. Emotion
    6. Action: if action.interaction = true then "1boy, <action.name>", else "<action.name>"
    7. Background: "<location.name> background", location.daytime, location.weather
    8. Character lora
- Do not add 'null' or 'empty' value if correcsponding attrobute is not set in scene tracker. 
- Exception for requirement above: 'outfit' should be added as 'completly nude' if empty or not defined.     

### Scene tracker UI

- User can display or hide current scene state UI (e.g. using 'slash' command in chat)
- UI should display current state of scene tracker in human readable form
- User can edit scene state attributes manually (except character name and lora)
- User can reset scene state attributes manually

### Multi chat behavior 
- If user switch to another chat then EverLook save current scene state and restore it when user switch back to the chat (also applies if new chat with the same cahracter)

### Group chats

Group chats are out of scope for MVP

### Logging
- All state changes should be logged in dev console
- All exceptions should be shown as SillyTavern toast message with human readable message

---