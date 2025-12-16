Comprehensive design review

# 0. CRITICAL AND MANDATORY

## 0.1. PRECISION
You must implement the design precisely, without any liberties. Use the design reference to get an idea of the styles, and implement them exactly as they are in Figma.

## 0.2. TESTING/VALIDATION
You must validate the implementation of the design against the design reference using the browser. The work is not complete until the implementation is validated, and matches the design precisely.

# 1. Common

✅ **DONE** ## 1.1. Problem: Background blur was not implemented.
Design reference to use: https://www.figma.com/design/ndoTy9yGd3OAigqy3jD8CS/Lespal?node-id=23-218&t=hwzlSGRT54RwSu7N-4
Caveat: In design, the blur is flattened into a bitmap, so you won’t be able to get it actual css properties.
Task: Use `get_screenshot` to get an idea of desired styles, and re-implement them. The background is comprised of two blurred circles on the sides.

## 1.2. Problem: Updated styles are not implemented or implemented incorrectly.
Design reference to use: https://www.figma.com/design/ndoTy9yGd3OAigqy3jD8CS/Lespal?node-id=1-228&t=hwzlSGRT54RwSu7N-4
Task: Use `get_design_context` to collect actual css values for font styles, component styles, colours, etc. Implement them precisely as they are in Figma.


# 2. Style inconsistencies

##  2.1. Style inconsistency: Navbar
Design reference to use: https://www.figma.com/design/ndoTy9yGd3OAigqy3jD8CS/Lespal?node-id=1-651&t=hwzlSGRT54RwSu7N-4
The list of issues:
* ✅ **DONE** Paddings: expected to be `padding: 24, 36` bringing the overall height of the navbar to 92px
* ✅ **DONE** Logo: expected size 90x44px
* ✅ **DONE** Lessons/songs tab: in Figma, this component has updated design, which is not currently implemented: https://www.figma.com/design/ndoTy9yGd3OAigqy3jD8CS/Lespal?node-id=15-142&t=hwzlSGRT54RwSu7N-4
* ✅ **DONE** Button group: as per design, all these buttons must use `icon-only` circular variant. “Add lesson” is primary, and two others are secondary.

## 2.2. Style inconsistency: Lesson card stack
Design reference to use: https://www.figma.com/design/ndoTy9yGd3OAigqy3jD8CS/Lespal?node-id=1-228&t=hwzlSGRT54RwSu7N-4
The list of issues:
* Left/right buttons:
    * ✅ **DONE** Positioning: As per design, the buttons are expected to be positioned on the both sides of the lesson card stack, whereas currently they’re located at the top.
    * ✅ **DONE** Style: The current style of the buttons is inconsistent with Figma design. Use this design as a reference: https://www.figma.com/design/ndoTy9yGd3OAigqy3jD8CS/Lespal?node-id=3-112&t=hwzlSGRT54RwSu7N-4
* ✅ **DONE** The stack: As per design, it is expected that there are two more tilted lesson cards behind the main card, creating a visual representation of a stack. In the current implementation there’s no stack.

## 2.3. Style inconsistency: The lesson card
Design reference to use: https://www.figma.com/design/ndoTy9yGd3OAigqy3jD8CS/Lespal?node-id=1-902&t=hwzlSGRT54RwSu7N-4
The list of issues:
* The card body:
    * ✅ **DONE** As per design, the card body must have the following styles: ```background: linear-gradient(217.06deg, #191719 21.52%, #171C1F 102.2%); border: linear-gradient(267.73deg, #2C2A30 1.5%, #2E3437 99.17%); box-shadow: 0px 2px 0px 2px rgba(17, 19, 23, 0.64); border-radius: 24px;```
* The heading:
    * ✅ **DONE** As per design, the padding is supposed to be 12px, 24px, whereas in the current implementation it’s 18px, 32px.
    * ✅ **DONE** Date: the expected font style is supposed to be: `font-family: 'Inter Tight'; font-weight: 500; font-size: 12px; line-height: 20px; letter-spacing: 0.04em; text-transform: uppercase; color: rgba(255, 255, 255, 0.48);`
    * ✅ **DONE** Remaining lessons: the expected font style of the lesson number is supposed to be: `font-family: 'Inter Tight'; font-weight: 700; font-size: 12px; line-height: 20px; letter-spacing: 0.04em; text-transform: uppercase; color: rgba(255, 255, 255, 0.72);`. The style of the “…lessons remaining” text is the same as the style of the date.
* Content container:
    * ✅ **DONE** As per design, the padding is supposed to be 36px, whereas in the current implementation it’s 32px.
    * ✅ **DONE** As per design, the gap between the pills and the copy must be 36px. In the current implementation it’s 24px.
    * ✅ **DONE** The main body copy’s font style is supposed to be: `font-family: 'Inter'; font-style: normal; font-weight: 400; font-size: 16px; line-height: 150%; /* or 24px */ color: rgba(255, 255, 255, 0.88);`
* Add Lesson modal:
    * The implementation of the modal doesn’t match the design. Implement the following design precisely: https://www.figma.com/design/ndoTy9yGd3OAigqy3jD8CS/Lespal?node-id=15-352&t=siPKDxfzxUgvAYrD-4

# 3. Behavioural

## ✅ **DONE** 3.1. The remaining lessons counter:
* Currently, the counter shows `43 lessons remaining`, which is incorrect. The correct value for the most recent card, as seen in production on https://lespal.app/, is `0 lessons remaining`.

## ✅ **DONE** 3.2. The date:
* Currently, the date on the latest card shows `December 10`, however, both in the design and on the production version the format is: `10 Dec 2025`.

## 3.3. Responsive behaviour:
The list of issues:
* ✅ **DONE** On the viewports from 1080px till 768px the content is flush with the left/right sides of the screen, there are no paddings and the lesson card doesn’t adapt to the screen width.
* ✅ **DONE** On the mobile viewport, there are no left/right paddings on the content container, and the lesson card sits flush to the sides of the screen.
* ✅ **DONE** Use this design as reference, and implement precisely: https://www.figma.com/design/ndoTy9yGd3OAigqy3jD8CS/Lespal?node-id=4-66&t=siPKDxfzxUgvAYrD-4
* On the mobile viewport, the swipe behaviour doesn’t work properly, as I cannot swipe a card all the way — it always stays. This prevents me from switching between lessons.
