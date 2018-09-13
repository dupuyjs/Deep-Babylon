# Deep Babylon

### Installation

1. Run `npm install` in the `Deep-Babylon` directory.

2. Add `.env` file to the root directory with **Custom Vision Training Key** located in https://www.customvision.ai/projects#/settings (select Limited Trial account) with the following syntax.

```powershell
# Custom Vision Training Key
COGNITIVE_CUSTOM_VISION_API_TRAININGKEY=7eeeeecb25dc4c0eabbbbbbbbbb3dbbd
```

### Run Deep Babylon

Run `npm start` in the `Deep-Babylon` directory.


### Notes

export PYTHONPATH=$PYTHONPATH:`pwd`:`pwd`/slim 

Upload the content on ./models/research/object_detection/deep_babylon.
Unzip data.zip


python train.py --logtostderr --train_dir=./models/train --pipeline_config_path=faster_rcnn_inception_v2_babylon.config

python export_inference_graph.py --input_type image_tensor --pipeline_config_path ./faster_rcnn_inception_v2_babylon.config --trained_checkpoint_prefix ./data/model.ckpt-9149 --output_directory ./fine_tuned_model

python eval.py \
    --logtostderr \
    --pipeline_config_path=./faster_rcnn_inception_v2_babylon.config \
    --checkpoint_dir=./models/train \
    --eval_dir=eval/