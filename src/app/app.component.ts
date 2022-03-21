import { Component, Input, ViewEncapsulation } from '@angular/core';

import { HMSReactiveStore, HMSStore, selectPeers, selectIsConnectedToRoom } from '@100mslive/hms-video-store';

import * as hmsAll from '@100mslive/hms-video-store';

import { Observable } from 'rxjs';

import { IConfig } from './config.model';
import { AnySoaRecord } from 'dns';

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


  public join() {
    hmsStore.subscribe(this.onRoomStateChange, selectIsConnectedToRoom);
    hmsActions.join({
      userName: 'teste1',
      authToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjIyYjljZDk0NGFlMDRiNTFjYWZmZjcwIiwicm9vbV9pZCI6IjYyMzIxNWYzZjA5N2MxNWI5YzdjNjIyOSIsInVzZXJfaWQiOiI2MjJiOWNkOTQ0YWUwNGI1MWNhZmZmNmQiLCJyb2xlIjoiZ3Vlc3QiLCJqdGkiOiI0MGI4Nzk5NC1hN2Y4LTQxNmUtYTM2NS1mZTZkNmRlYjNlMDUiLCJ0eXBlIjoiYXBwIiwidmVyc2lvbiI6MiwiZXhwIjoxNjQ3OTU2ODA5fQ.QsHpmE-F44viEgpgpus8wGpRvgv9REwD_fvPR-NV88I'
    });
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
    console.log("🚀 ~ file: app.component.ts ~ line 88 ~ AppComponent ~ renderPeers ~ peers", peers)
    await AppComponent.prototype.delay(10);
    for (const [i, v] of peers.entries()) {
      if (v.videoTrack) {
        hmsActions.attachVideo(v.videoTrack, <HTMLVideoElement>document.getElementsByTagName('video')[i]).catch((error: any) => {
          return error;
        });
      }
      for (const [l, p] of v.auxiliaryTracks.entries()) {
        const track = hmsStore.getState(hmsAll.selectTrackByID(p));
        console.log("🚀 ~ file: app.component.ts ~ line 98 ~ AppComponent ~ renderPeers ~ track", track);
        if (track?.type == "video") {
          hmsActions.attachVideo(p, <HTMLVideoElement>document.getElementsByClassName('screen-share')[l]).catch((error: any) => {
            return error;
          });
        }
      }
    }
  }

  public sendMessage() {
    hmsActions.sendBroadcastMessage('hello everyone!');
  }
}