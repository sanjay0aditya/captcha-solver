import torch
import torch.nn as nn
import torch.nn.functional as F

class OCRModel(nn.Module):
    def __init__(self, img_width=200, img_height=50):
        num_chars=63
        super(OCRModel, self).__init__()

        # CNN layers with batch normalization
        self.cnn = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),

            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2, 2)
        )

        # Calculate feature dimensions after CNN layers
        feature_h = img_height // 4  # 2 MaxPool layers -> height // 4
        feature_w = img_width // 4  # 2 MaxPool layers -> width // 4

        # Dense layer after CNN
        self.dense1 = nn.Sequential(
            nn.Linear(feature_h * 64, 128),  # Input size matches flattened CNN output
            nn.BatchNorm1d(50),
            nn.ReLU(),
            nn.Dropout(0.2)
        )

        # Bidirectional LSTM layers
        self.lstm1 = nn.LSTM(128, 128, bidirectional=True, batch_first=True, dropout=0.25)
        self.lstm2 = nn.LSTM(256, 64, bidirectional=True, batch_first=True, dropout=0.25)

        # Final dense layer
        self.dense2 = nn.Linear(128, num_chars + 1)  # +1 for CTC blank label

        # Initialize weights
        self._initialize_weights()

    def _initialize_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.BatchNorm2d) or isinstance(m, nn.BatchNorm1d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
                nn.init.constant_(m.bias, 0)

    def forward(self, x):
        # CNN feature extraction
        x = self.cnn(x)
        batch_size, channels, height, width = x.size()

        # Reshape for dense layer
        x = x.permute(0, 3, 1, 2)  # (batch, channels, height, width) -> (batch, width, channels, height)
        x = x.contiguous().view(batch_size, width, -1)  # Flatten height and channels for dense input

        # Dense layer
        x = self.dense1(x)

        # LSTM layers
        x, _ = self.lstm1(x)
        x, _ = self.lstm2(x)

        # Final dense layer for character predictions
        x = self.dense2(x)
        x = F.log_softmax(x, dim=2)  # Log softmax over character predictions

        return x
