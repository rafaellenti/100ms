import { Component, Input, ViewEncapsulation } from '@angular/core';
import { HMSReactiveStore, HMSStore, selectPeers, selectIsConnectedToRoom } from '@100mslive/hms-video-store';
import { HMSVirtualBackgroundPlugin } from '@100mslive/hms-virtual-background';
import * as hmsAll from '@100mslive/hms-video-store';
import { Observable } from 'rxjs';
import { IConfig } from './config.model';

const hms = new HMSReactiveStore();
const hmsStore = hms.getStore();
const hmsActions = hms.getActions();


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  peerStore!: HMSStore;

  @Input()
  public name!: string;

  @Input() public authToken = 'any';

  peersList: Array<any> = [];
  hmsStore!: hmsAll.HMSStore;
  allow!: Observable<boolean>;
  componente: any = AppComponent.prototype;
  messageList: Array<any> = [];
  virtualBackground = new HMSVirtualBackgroundPlugin('blur');


  public join() {
    hmsStore.subscribe(this.onRoomStateChange, selectIsConnectedToRoom);
    hmsActions.join({
      userName: 'Guest',
      authToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjIyYjljZDk0NGFlMDRiNTFjYWZmZjcwIiwicm9vbV9pZCI6IjYyMzhjM2VhNDRhZTA0YjUxY2IwNTI2NSIsInVzZXJfaWQiOiI2MjJiOWNkOTQ0YWUwNGI1MWNhZmZmNmQiLCJyb2xlIjoiZ3Vlc3QiLCJqdGkiOiI1ZTk0ZTNlNC0yNTEyLTRiNTItOTU0Zi01OWQzYTMyN2U0MDgiLCJ0eXBlIjoiYXBwIiwidmVyc2lvbiI6MiwiZXhwIjoxNjQ4MDUzNzQ4fQ.WK_DUl7J-mFdu9zi1pnwqlDZtsbH3xqKmd7X1LVlg6E'
    });
    AppComponent.prototype.messageList = [];
  }

  public leave() {
    hmsActions.leave();
  }

  public localPeerConfig(config: IConfig) {
    const video = hmsStore.getState(hmsAll.selectIsLocalVideoEnabled);
    const audio = hmsStore.getState(hmsAll.selectIsLocalAudioEnabled);
    const screen = hmsStore.getState(hmsAll.selectIsLocalScreenShared);

    hmsActions.setLocalVideoEnabled(config.video ? !video : video);
    hmsActions.setLocalAudioEnabled(config.audio ? !audio : audio);
    hmsActions.setScreenShareEnabled(config.screen ? !screen : screen);

    this.renderPeers(AppComponent.prototype.peersList);
  }

  private onRoomStateChange(connected: boolean | undefined) {
    if (connected) {
      AppComponent.prototype.peersList = [];
      hmsStore.subscribe(AppComponent.prototype.renderPeers, selectPeers);
      hmsStore.subscribe(AppComponent.prototype.renderMessages, hmsAll.selectHMSMessages);
    }
  }


  private delay(ms: number): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, ms);
    });
  }

  private async renderPeers(peers: any) {
    AppComponent.prototype.peersList = peers;
    await AppComponent.prototype.delay(10);
    for (const [i, v] of peers.entries()) {
      if (v.videoTrack) {
        hmsActions.attachVideo(v.videoTrack, <HTMLVideoElement>document.getElementsByTagName('video')[i]).catch((error: any) => {
          return error;
        });
      }
      for (const [l, p] of v.auxiliaryTracks.entries()) {
        const track = hmsStore.getState(hmsAll.selectTrackByID(p));
        if (track?.type == 'video') {
          hmsActions.attachVideo(p, <HTMLVideoElement>document.getElementsByClassName('screen-share')[l]).catch((error: any) => {
            return error;
          });
        }
      }
    }
  }

  private renderMessages(messages: any) {
    AppComponent.prototype.messageList = messages;
    console.log(AppComponent.prototype.messageList);
  }

  public sendMessage(type: number, peerId?: string, name?: string) {
    console.log(name);
    if (type == 0) hmsActions.sendBroadcastMessage('hello everyone!');
    if (type == 1) hmsActions.sendGroupMessage('hi folks!', ['guest', 'host']);
    if (type == 2) hmsActions.sendDirectMessage('keep this message a secret!', peerId as string);
  }

  async toggleVB() {
    const isVirtualBackgroundEnabled = hmsStore.getState(
      hmsAll.selectIsLocalVideoPluginPresent(this.virtualBackground.getName())
    );
    try {

      if (!isVirtualBackgroundEnabled) {
        // Recommended value
        const pluginFrameRate = 15;
        // add virtual background
        await hmsActions.addPluginToVideoTrack(this.virtualBackground, pluginFrameRate);
      } else {
        // remove virtual background
        await hmsActions.removePluginFromVideoTrack(this.virtualBackground);
      }
      await AppComponent.prototype.renderPeers(AppComponent.prototype.peersList);

    } catch (err) {
      console.log('virtual background failure - ', isVirtualBackgroundEnabled, err);
    }
  }

  async start() {
    const params = {
      meetingURL: "https://barbosa.app.100ms.live/meeting/yrf-thq-ptg",
      record: true
    };
    try {
      await hmsActions.startRTMPOrRecording(params);
    } catch (err) {
      console.error("failed to start rtmp/recording", err);
    }
  }

  async stop() {
    try {
      await hmsActions.stopRTMPAndRecording();
    } catch (err) {
      console.error("failed to stop rtmp/recording", err);
    }
  }
}