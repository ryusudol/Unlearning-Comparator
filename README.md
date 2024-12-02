# Machine Unlearning Comparator

A visualization tool for comparing different machine unlearning methods and evaluating their effectiveness through privacy attacks.

## Features

The Machine Unlearning Comparator provides comparison of various baseline methods:
- FineTuning
- Gradient Ascent
- Random Labeling

It includes various visualizations and evaluations through privacy attacks to assess the effectiveness of each method.

![Machine Unlearning Comparator](img/comparator.png)

## Demo

Try our live demo: [Machine Unlearning Comparator](https://gnueaj.github.io/Unlearning-Comparator/)

## How to Start

### Backend

1. **Install Dependencies Using Hatch**
   ```shell
   hatch shell
   ```

2. **Start the Backend Server**
   ```shell
   hatch run start
   ```

### Frontend

1. **Install Dependencies Using pnpm**
   ```shell
   pnpm install
   ```

2. **Start the Frontend Server**
   ```shell
   pnpm start
   ```
