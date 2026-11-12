import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonRadioGroup,
  IonRadio,
  IonLabel,
  IonButton,
  IonIcon,
  IonFooter,
  AlertController,
} from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { addIcons } from 'ionicons';
import { cameraOutline } from 'ionicons/icons';
import { ReportService, ReportItem } from '../services/report.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonRadioGroup,
    IonRadio,
    IonLabel,
    IonButton,
    IonIcon,
    IonFooter,
  ],
})
export class Tab2Page {
  private reportService = inject(ReportService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  public photoUrl: string | null = null;

  // The model bound to the form
  public newItem: Omit<ReportItem, 'id' | 'created_at'> = {
    title: '',
    category: 'tumbler',
    location: '',
    finder_name: '',
    custody: 'surrendered',
    description: '',
    photo_url: '',
  };

  constructor() {
    addIcons({ cameraOutline });
  }

  // ==========================================
  // MOBILE CAPABILITY: Capacitor Camera
  // ==========================================
  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 60,                        // 👈 Compact file size
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,        // 👈 Strictly opens camera (no gallery)
        width: 600,                         // 👈 Resizes to avoid huge payloads
        height: 600,
      });

      if (image.dataUrl) {
        this.photoUrl = image.dataUrl;
        this.newItem.photo_url = image.dataUrl;
      }
    } catch (error) {
      console.log('User cancelled camera or permission denied:', error);
    }
  }

  // ==========================================
  // STEP 1: Verification Dialog Before POST
  // (Prevents mistakes since there is no edit/delete)
  // ==========================================
  async submitReport() {
    // 1. Validation check
    if (!this.newItem.title || !this.newItem.location || !this.newItem.description) {
      const errorAlert = await this.alertCtrl.create({
        header: 'Incomplete Details',
        message: 'Please provide the item name, location, and claiming details.',
        buttons: ['OK'],
      });
      await errorAlert.present();
      return;
    }

    // 2. Format custody text
    const custodyText =
      this.newItem.custody === 'surrendered'
        ? 'Surrendered to Campus Office'
        : 'Kept with Finder';

    // 3. Double-check confirmation alert
    const confirmAlert = await this.alertCtrl.create({
      header: 'Confirm Your Report',
      subHeader: 'Please double-check your details before submitting (cannot be edited later).',
      message: `
        <strong>Item:</strong> ${this.newItem.title}<br>
        <strong>Category:</strong> ${this.newItem.category}<br>
        <strong>Location:</strong> ${this.newItem.location}<br>
        <strong>Status:</strong> ${custodyText}<br>
        <strong>Details:</strong> ${this.newItem.description}
      `,
      buttons: [
        {
          text: 'Review Again',
          role: 'cancel',
        },
        {
          text: 'Confirm & Post',
          handler: () => {
            this.executePost();
          },
        },
      ],
    });

    await confirmAlert.present();
  }

  // ==========================================
  // STEP 2: The POST Operation & Haptics Feedback
  // ==========================================
  private async executePost() {
    try {
      // 1. Fire the POST operation via HttpClient
      await this.reportService.addReport(this.newItem);

      // 2. Mobile Capability: Vibration confirmation
      await Haptics.notification({ type: NotificationType.Success });

      // 3. Reset form
      this.newItem = {
        title: '',
        category: 'tumbler',
        location: '',
        finder_name: '',
        custody: 'surrendered',
        description: '',
        photo_url: '',
      };
      this.photoUrl = null;

      // 4. Navigate back to Tab 1 to see the new item on the feed!
      this.router.navigate(['/tabs/tab1']);

    } catch (error: any) {
      console.error('Failed to submit report:', error);

      const detail = error?.status
        ? `HTTP ${error.status}: ${error?.error?.message || error?.statusText || error?.message}`
        : (error?.message || JSON.stringify(error));

      const errAlert = await this.alertCtrl.create({
        header: 'Submission Failed',
        message: detail,
        buttons: ['OK'],
      });
      await errAlert.present();
    }
  }
}