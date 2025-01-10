import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class ProducerService implements OnModuleInit, OnModuleDestroy {
  private isRunning = false;
  private messageCount = 0;

  // Calculate Euclidean distance between two RGB colors
  private colorDistance(
    color1: [number, number, number],
    color2: [number, number, number],
  ): number {
    return Math.sqrt(
      Math.pow(color1[0] - color2[0], 2) +
        Math.pow(color1[1] - color2[1], 2) +
        Math.pow(color1[2] - color2[2], 2),
    );
  }

  // Get the closest primary color
  private getClosestPrimaryColor(colorName: string): string {
    // Expanded set of primary and secondary colors
    const primaryColors = {
      Red: [255, 0, 0],
      Orange: [255, 165, 0],
      Yellow: [255, 255, 0],
      Green: [0, 255, 0],
      Blue: [0, 0, 255],
      Purple: [128, 0, 128],
      Pink: [255, 192, 203],
      Brown: [165, 42, 42],
      White: [255, 255, 255],
      Black: [0, 0, 0],
      Gray: [128, 128, 128],
    };

    // Convert color name to RGB values using our lookup table
    const commonColors: { [key: string]: [number, number, number] } = {
      Red: [255, 0, 0],
      Green: [0, 255, 0],
      Blue: [0, 0, 255],
      Yellow: [255, 255, 0],
      Purple: [128, 0, 128],
      Orange: [255, 165, 0],
      Black: [0, 0, 0],
      White: [255, 255, 255],
      Gray: [128, 128, 128],
      Pink: [255, 192, 203],
      Brown: [165, 42, 42],
      Cyan: [0, 255, 255],
      Magenta: [255, 0, 255],
      LightBlue: [173, 216, 230],
      DarkBlue: [0, 0, 139],
      LightGreen: [144, 238, 144],
      DarkGreen: [0, 100, 0],
      LightRed: [255, 102, 102],
      DarkRed: [139, 0, 0],
      AliceBlue: [240, 248, 255],
      AntiqueWhite: [250, 235, 215],
      Aqua: [0, 255, 255],
      Aquamarine: [127, 255, 212],
      Azure: [240, 255, 255],
      Beige: [245, 245, 220],
      Bisque: [255, 228, 196],
      BlanchedAlmond: [255, 235, 205],
      BlueViolet: [138, 43, 226],
      BurlyWood: [222, 184, 135],
      CadetBlue: [95, 158, 160],
      Chartreuse: [127, 255, 0],
      Chocolate: [210, 105, 30],
      Coral: [255, 127, 80],
      CornflowerBlue: [100, 149, 237],
      Cornsilk: [255, 248, 220],
      Crimson: [220, 20, 60],
      DarkCyan: [0, 139, 139],
      DarkGoldenRod: [184, 134, 11],
      DarkGray: [169, 169, 169],
      DarkKhaki: [189, 183, 107],
      DarkMagenta: [139, 0, 139],
      DarkOliveGreen: [85, 107, 47],
      DarkOrange: [255, 140, 0],
      DarkOrchid: [153, 50, 204],
      DarkSalmon: [233, 150, 122],
      DarkSeaGreen: [143, 188, 143],
      DarkSlateBlue: [72, 61, 139],
      DarkSlateGray: [47, 79, 79],
      DarkTurquoise: [0, 206, 209],
      DarkViolet: [148, 0, 211],
      DeepPink: [255, 20, 147],
      DeepSkyBlue: [0, 191, 255],
      DimGray: [105, 105, 105],
      DodgerBlue: [30, 144, 255],
      FireBrick: [178, 34, 34],
      ForestGreen: [34, 139, 34],
      Fuchsia: [255, 0, 255],
      Gainsboro: [220, 220, 220],
      GhostWhite: [248, 248, 255],
      Gold: [255, 215, 0],
      GoldenRod: [218, 165, 32],
      GreenYellow: [173, 255, 47],
      HoneyDew: [240, 255, 240],
      HotPink: [255, 105, 180],
      IndianRed: [205, 92, 92],
      Indigo: [75, 0, 130],
      Ivory: [255, 255, 240],
      Khaki: [240, 230, 140],
      Lavender: [230, 230, 250],
      LavenderBlush: [255, 240, 245],
      LawnGreen: [124, 252, 0],
      LemonChiffon: [255, 250, 205],
      LightCoral: [240, 128, 128],
      LightCyan: [224, 255, 255],
      LightGoldenRodYellow: [250, 250, 210],
      LightGray: [211, 211, 211],
      LightPink: [255, 182, 193],
      LightSalmon: [255, 160, 122],
      LightSeaGreen: [32, 178, 170],
      LightSkyBlue: [135, 206, 250],
      LightSlateGray: [119, 136, 153],
      LightSteelBlue: [176, 196, 222],
      LightYellow: [255, 255, 224],
      Lime: [0, 255, 0],
      LimeGreen: [50, 205, 50],
      Linen: [250, 240, 230],
      Maroon: [128, 0, 0],
      MediumAquaMarine: [102, 205, 170],
      MediumBlue: [0, 0, 205],
      MediumOrchid: [186, 85, 211],
      MediumPurple: [147, 112, 219],
      MediumSeaGreen: [60, 179, 113],
      MediumSlateBlue: [123, 104, 238],
      MediumSpringGreen: [0, 250, 154],
      MediumTurquoise: [72, 209, 204],
      MediumVioletRed: [199, 21, 133],
      MidnightBlue: [25, 25, 112],
      MintCream: [245, 255, 250],
      MistyRose: [255, 228, 225],
      Moccasin: [255, 228, 181],
      NavajoWhite: [255, 222, 173],
      Navy: [0, 0, 128],
      OldLace: [253, 245, 230],
      Olive: [128, 128, 0],
      OliveDrab: [107, 142, 35],
      OrangeRed: [255, 69, 0],
      Orchid: [218, 112, 214],
      PaleGoldenRod: [238, 232, 170],
      PaleGreen: [152, 251, 152],
      PaleTurquoise: [175, 238, 238],
      PaleVioletRed: [219, 112, 147],
      PapayaWhip: [255, 239, 213],
      PeachPuff: [255, 218, 185],
      Peru: [205, 133, 63],
      Plum: [221, 160, 221],
      PowderBlue: [176, 224, 230],
      RebeccaPurple: [102, 51, 153],
      RosyBrown: [188, 143, 143],
      RoyalBlue: [65, 105, 225],
      SaddleBrown: [139, 69, 19],
      Salmon: [250, 128, 114],
      SandyBrown: [244, 164, 96],
      SeaGreen: [46, 139, 87],
      SeaShell: [255, 245, 238],
      Sienna: [160, 82, 45],
      Silver: [192, 192, 192],
      SkyBlue: [135, 206, 235],
      SlateBlue: [106, 90, 205],
      SlateGray: [112, 128, 144],
      Snow: [255, 250, 250],
      SpringGreen: [0, 255, 127],
      SteelBlue: [70, 130, 180],
      Tan: [210, 180, 140],
      Teal: [0, 128, 128],
      Thistle: [216, 191, 216],
      Tomato: [255, 99, 71],
      Turquoise: [64, 224, 208],
      Violet: [238, 130, 238],
      Wheat: [245, 222, 179],
      WhiteSmoke: [245, 245, 245],
      YellowGreen: [154, 205, 50],
    };

    // Get RGB values for the color
    let targetRGB: [number, number, number];
    if (colorName in commonColors) {
      targetRGB = commonColors[colorName];
    } else {
      // If color not found in lookup, default to gray
      targetRGB = [128, 128, 128];
    }

    // Find the closest primary color by RGB distance
    let closestColor = 'Red';
    let minDistance = Number.MAX_VALUE;

    for (const [color, rgb] of Object.entries(primaryColors)) {
      const distance = this.colorDistance(
        targetRGB,
        rgb as [number, number, number],
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }

    return closestColor;
  }

  // List of HTML color names
  private readonly colors = [
    'AliceBlue',
    'AntiqueWhite',
    'Aqua',
    'Aquamarine',
    'Azure',
    'Beige',
    'Bisque',
    'Black',
    'BlanchedAlmond',
    'Blue',
    'BlueViolet',
    'Brown',
    'BurlyWood',
    'CadetBlue',
    'Chartreuse',
    'Chocolate',
    'Coral',
    'CornflowerBlue',
    'Cornsilk',
    'Crimson',
    'Cyan',
    'DarkBlue',
    'DarkCyan',
    'DarkGoldenRod',
    'DarkGray',
    'DarkGreen',
    'DarkKhaki',
    'DarkMagenta',
    'DarkOliveGreen',
    'DarkOrange',
    'DarkOrchid',
    'DarkRed',
    'DarkSalmon',
    'DarkSeaGreen',
    'DarkSlateBlue',
    'DarkSlateGray',
    'DarkTurquoise',
    'DarkViolet',
    'DeepPink',
    'DeepSkyBlue',
    'DimGray',
    'DodgerBlue',
    'FireBrick',
    'FloralWhite',
    'ForestGreen',
    'Fuchsia',
    'Gainsboro',
    'GhostWhite',
    'Gold',
    'GoldenRod',
    'Gray',
    'Green',
    'GreenYellow',
    'HoneyDew',
    'HotPink',
    'IndianRed',
    'Indigo',
    'Ivory',
    'Khaki',
    'Lavender',
    'LavenderBlush',
    'LawnGreen',
    'LemonChiffon',
    'LightBlue',
    'LightCoral',
    'LightCyan',
    'LightGoldenRodYellow',
    'LightGray',
    'LightGreen',
    'LightPink',
    'LightSalmon',
    'LightSeaGreen',
    'LightSkyBlue',
    'LightSlateGray',
    'LightSteelBlue',
    'LightYellow',
    'Lime',
    'LimeGreen',
    'Linen',
    'Magenta',
    'Maroon',
    'MediumAquaMarine',
    'MediumBlue',
    'MediumOrchid',
    'MediumPurple',
    'MediumSeaGreen',
    'MediumSlateBlue',
    'MediumSpringGreen',
    'MediumTurquoise',
    'MediumVioletRed',
    'MidnightBlue',
    'MintCream',
    'MistyRose',
    'Moccasin',
    'NavajoWhite',
    'Navy',
    'OldLace',
    'Olive',
    'OliveDrab',
    'Orange',
    'OrangeRed',
    'Orchid',
    'PaleGoldenRod',
    'PaleGreen',
    'PaleTurquoise',
    'PaleVioletRed',
    'PapayaWhip',
    'PeachPuff',
    'Peru',
    'Pink',
    'Plum',
    'PowderBlue',
    'Purple',
    'RebeccaPurple',
    'Red',
    'RosyBrown',
    'RoyalBlue',
    'SaddleBrown',
    'Salmon',
    'SandyBrown',
    'SeaGreen',
    'SeaShell',
    'Sienna',
    'Silver',
    'SkyBlue',
    'SlateBlue',
    'SlateGray',
    'Snow',
    'SpringGreen',
    'SteelBlue',
    'Tan',
    'Teal',
    'Thistle',
    'Tomato',
    'Turquoise',
    'Violet',
    'Wheat',
    'White',
    'WhiteSmoke',
    'Yellow',
    'YellowGreen',
  ];

  constructor(private readonly redisService: RedisService) {}

  onModuleInit() {
    this.startProducing();
  }

  onModuleDestroy() {
    this.stopProducing();
  }

  private startProducing() {
    this.isRunning = true;
    this.produceMessages();
  }

  private stopProducing() {
    this.isRunning = false;
  }

  private getRandomColor(): string {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  private async produceMessages() {
    while (this.isRunning) {
      try {
        const color = this.getRandomColor();
        const message = {
          id: ++this.messageCount,
          timestamp: new Date().toISOString(),
          data: `Message ${this.messageCount}`,
          color: color,
          primaryColor: this.getClosestPrimaryColor(color),
        };

        await this.redisService.enqueue(JSON.stringify(message));

        // Optional: Add a small delay to prevent overwhelming the system
        // await new Promise(resolve => setTimeout(resolve, 1));
      } catch (error) {
        console.error('Error producing message:', error);
        // Add a small delay on error to prevent tight error loops
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  getMessageCount(): number {
    return this.messageCount;
  }
}
