import os
import pickle
import numpy as np

def load_cifar10_batch(file):
    with open(file, 'rb') as fo:
        dict = pickle.load(fo, encoding='bytes')
    return dict[b'data'], dict[b'labels']

def load_cifar10_data():
    data_dir = 'data/cifar-10-batches-py'
    x_train = []
    y_train = []

    for i in range(1, 6):
        filename = os.path.join(data_dir, f'data_batch_{i}')
        X, Y = load_cifar10_batch(filename)
        x_train.append(X)
        y_train.append(Y)

    x_train = np.concatenate(x_train)
    y_train = np.concatenate(y_train)

    return x_train.reshape(50000, 3, 32, 32).transpose(0, 2, 3, 1), y_train
