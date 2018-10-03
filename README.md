# Deep Babylon

### Prerequisites

[Visual Studio Code](https://code.visualstudio.com/)
[TypeScript](https://www.npmjs.com/package/typescript)

### Installation

- Clone the repository
- Run `npm install` in the `Deep-Babylon` directory

### Run Deep Babylon

- Run `npm start` in the `Deep-Babylon` directory
- Launch http://localhost:8081/ on your favorite browser

### Notes 

export PYTHONPATH=$PYTHONPATH:`pwd`:`pwd`/slim 

Upload the content on ./models/research/object_detection/deep_babylon
Unzip data.zip

python train.py --logtostderr --train_dir=./models/train --pipeline_config_path=faster_rcnn_inception_v2_babylon.config

python export_inference_graph.py --input_type image_tensor --pipeline_config_path ./faster_rcnn_inception_v2_babylon.config --trained_checkpoint_prefix ./data/model.ckpt-9149 --output_directory ./fine_tuned_model

python eval.py \
    --logtostderr \
    --pipeline_config_path=./faster_rcnn_inception_v2_babylon.config \
    --checkpoint_dir=./models/train \
    --eval_dir=eval/