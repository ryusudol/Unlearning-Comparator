# Machine Unlearning Comparator

This tool facilitates the evaluation and comparison of machine unlearning methods by providing interactive visualizations and analytical insights. It enables a systematic examination of model behavior through privacy attacks and performance metrics, offering comprehensive analysis of various unlearning techniques.

## Demo

Try our live demo: [Machine Unlearning Comparator](https://gnueaj.github.io/Unlearning-Comparator/)

![Machine Unlearning Comparator](img/comparator.png)

## Features

The Machine Unlearning Comparator provides comparison of various baseline methods:
- FineTuning
- Gradient Ascent
- Random Labeling

It includes various visualizations and evaluations through privacy attacks to assess the effectiveness of each method.

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
