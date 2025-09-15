export const temp = `
# Markdown Feature Showcase

This document is a comprehensive test case for Markdown rendering. It includes a wide variety of elements, from basic text formatting to more advanced features like tables, code blocks, and nested lists. Use this to verify that your Markdown previewer or parser handles all cases correctly.

---

## Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

---

## Text Formatting

This is a standard paragraph. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Here are some text styles:

* **Bold text** using asterisks.
* __Bold text__ using underscores.
* *Italic text* using asterisks.
* _Italic text_ using underscores.
* ~~Strikethrough text~~.
* ***Bold and Italic text***.

---

## Blockquotes

Blockquotes are useful for quoting text from another source.

> This is a single-line blockquote. Proin eget tortor risus. Curabitur arcu erat, accansan id imperdiet et, porttitor at sem.

> This is a multi-line blockquote.
> Vivamus suscipit tortor eget felis porttitor volutpat. Donec rutrum congue leo eget malesuada.
>
> > This is a nested blockquote.
> > Cras ultricies ligula sed magna dictum porta.

> #### Blockquote with other elements
>
> You can include other Markdown elements inside a blockquote:
>
> 1.  An ordered list item.
> 2.  **Bold text**.
> 3.  A [link to Google](https://www.google.com).

---

## Lists

### Unordered List

* Item 1
* Item 2
    * Nested Item 2.1
    * Nested Item 2.2
        * Deeply Nested Item 2.2.1
* Item 3

### Ordered List

1.  First item
2.  Second item
3.  Third item
    1.  Nested ordered item
    2.  Another nested item
1.  The numbering will automatically correct, even if you type for every item. This is the fourth item.

---

## Code Blocks

You can have inline code, as shown earlier, or fenced code blocks for multiple lines.

\`\`\`javascript
// JavaScript code block
function greet(name) {
  return \\\`Hello, \${name}!\\\`;
}

const user = "World";
console.log(greet(user));
\`\`\`


---

<details>
<summary>Hint 1</summary>

Some very convienient hidden text
</details>

<details>
<summary>Hint 1</summary>

Some very convienient hidden text
</details>

<details>
<summary>Hint 1</summary>

Some very convienient hidden text
</details>


`;
