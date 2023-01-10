import React, { useMemo } from 'react';

import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import VideoPlayer from 'react-native-video';

import iconCloseXDark from '../../assets/images/iconCloseXDark.png';
import iconCloseXLight from '../../assets/images/iconCloseXLight.png';
import type { VideoModalSource } from '../inboxblocks/ImageWithOverlay';

export interface VideoModalProps {
  onCancel: () => void;
  video: VideoModalSource;
}
const DEFAULT_WIDTH = Dimensions.get('window').width;
const styles = StyleSheet.create({
  btn: {
    marginBottom: 49,
  },
  close: {
    position: 'absolute',
    right: 0,
    top: 26,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  backIconCloseX: {
    width: 44,
    height: 44,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    position: 'absolute',
    top: 0,
    padding: 10,
    zIndex: 10,
    width: '100%',
  },
  wrap: {
    flex: 1,
  },
});

const positionMap = {
  none: 'flex-start',
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

export const VideoModalComponent: React.FunctionComponent<VideoModalProps> = React.memo(
  ({ onCancel, video }) => {
    const onCloseModal = (): void => {
      onCancel();
    };
    const ratio = video.source.ratio ?? 1;

    const iconColor = useMemo(() => video.closeIcon?.color ?? 'dark', [video]);

    const findPosition = (pos: any) =>
      pos === 'left' ? 'flex-start' : pos === 'center' ? 'center' : 'flex-end';

    return (
      <TouchableOpacity activeOpacity={1} onPress={onCloseModal}>
        <View style={styles.container}>
          {video.closeIcon?.position !== 'none' && (
            <View
              style={[styles.header, { justifyContent: findPosition(video.closeIcon?.position) }]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{
                  top: 10,
                  right: 10,
                  bottom: 10,
                  left: 10,
                }}
                onPress={onCloseModal}
                style={{}}
              >
                <Image
                  style={styles.backIconCloseX}
                  source={iconColor === 'dark' ? iconCloseXDark : iconCloseXLight}
                />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.content}>
            <VideoPlayer
              resizeMode={'cover'}
              repeat={true}
              source={{ uri: (video.source.src ?? '').replace(/ /g, '%20') }}
              paused={false}
              style={{ width: DEFAULT_WIDTH, height: DEFAULT_WIDTH / ratio }}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);