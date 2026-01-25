---
draft: true
title: "Title for your recipe"
author: {{ .Site.Params.front.defaultAuthor | default "User" }}
recipe_image: {{ .Site.Params.front.defaultImage | default "images/defaultImage.png" }} #The image for your recipe
image_width: {{ .Site.Params.front.defaultImageWidth | default 512 }}
image_height: {{ .Site.Params.front.defaultImageHeight | default 512 }}
date: {{ .Date }}
tags: ["tag1", "tag2"] #tags for your recipe
tagline: "A short tagline for your recipe"
servings: 4
prep_time: 15 #in minutes #can be BLANK
cook: true # If we are cooking this, leave true, if we are cooling set to false
cook_increment: minutes # set to minutes or hours
cook_time: 8 #in minutes or hours #can be BLANK
calories: 300 #in kcal #can be BLANK

steps:
  - ingredients:
      - amount: 1
        unit: "cup"
        item: "First Ingredient"
      - amount: 2
        unit: "tablespoon"
        item: "Second Ingredient"
    text: "Step One instructions."
  - ingredients:
      - amount: 1
        unit: "teaspoon"
        item: "Third Ingredient"
      - "Fourth Ingredient (unscaled)"
    text: "Step Two instructions."
---
