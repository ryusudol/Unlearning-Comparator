import React from "react";
import "./App.css";

import Title from "./Components/Title";
import ContentBox from "./Components/ContentBox";
import SubTitle from "./Components/SubTitle";
import Button from "./Components/Button";

function App() {
  return (
    <div id="body-wrapper">
      <div className="left">
        <Title title="Settings" />
        <ContentBox height={45}>
          <SubTitle subtitle="Initial Settings" />
          <div className="select">
            <label htmlFor="models">Models</label>
            <select name="models" id="models">
              <option value="ResNet18">ResNet18</option>
              <option value="ResNet18">ResNet18</option>
              <option value="ResNet18">ResNet18</option>
              <option value="ResNet18">ResNet18</option>
              <option value="ResNet18">ResNet18</option>
              <option value="ResNet18">ResNet18</option>
              <option value="ResNet18">ResNet18</option>
            </select>
          </div>
          <div className="select">
            <label htmlFor="dataset">Dataset</label>
            <select name="dataset" id="dataset">
              <option value="CIFAR-10">CIFAR-10</option>
              <option value="CIFAR-10">CIFAR-10</option>
              <option value="CIFAR-10">CIFAR-10</option>
              <option value="CIFAR-10">CIFAR-10</option>
              <option value="CIFAR-10">CIFAR-10</option>
              <option value="CIFAR-10">CIFAR-10</option>
              <option value="CIFAR-10">CIFAR-10</option>
            </select>
          </div>
          <div>
            <span>Method</span>
            <div className="select">
              <label htmlFor="predefined">Predefined</label>
              <select name="predefined" id="predefined">
                <option value="method1">method1</option>
                <option value="method2">method2</option>
                <option value="method3">method3</option>
                <option value="method4">method4</option>
                <option value="method5">method5</option>
              </select>
            </div>
            <div className="select">
              <label htmlFor="custom">Custom</label>
              <input type="file" id="file-input" />
            </div>
          </div>
          <div className="select">
            <label htmlFor="seed">Seed</label>
            <select name="seed" id="seed">
              <option value="1234">1234</option>
            </select>
          </div>
          <div className="select">
            <label htmlFor="unlearn-class">Unlearn Class</label>
            <select name="unlearn-class" id="unlearn-class">
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
            </select>
          </div>
          <div style={{ marginTop: "2rem" }} />
          <SubTitle subtitle="Training | Unlearning" />
          <div className="select">
            <label htmlFor="batch-size">Batch Size</label>
            <select name="batch-size" id="batch-size">
              <option value="8">8</option>
              <option value="16">16</option>
              <option value="32">32</option>
              <option value="64">64</option>
              <option value="128">128</option>
              <option value="256">256</option>
              <option value="512">512</option>
            </select>
          </div>
          <div className="select">
            <label style={{ fontSize: "0.9rem" }} htmlFor="learning-rate">
              Learning Rate
            </label>
            <input type="number" />
          </div>
          <div className="select">
            <label htmlFor="epochs">Epochs</label>
            <input type="number" />
          </div>
          <Button buttonText="Run" />
        </ContentBox>
        <ContentBox height={25}>hi</ContentBox>
        <Title title="Histories" />
        <ContentBox height={20}>hi</ContentBox>
      </div>
      <div className="middle">
        <Title title="Embeddings" />
        <ContentBox height={45}>hi</ContentBox>
        <Title title="Performance Metrics" />
        <ContentBox height={45}>hi</ContentBox>
      </div>
      <div className="right">
        <Title title="Privacy Attacks" />
        <ContentBox height={50}>hi</ContentBox>
        <ContentBox height={45}>hi</ContentBox>
      </div>
    </div>
  );
}

export default App;
