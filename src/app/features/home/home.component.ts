import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  // For demo, we can add some dummy data
  featuredProducts = [
    { id: 1, name: 'ابزار multifunctionprofessional', price: 2450000, oldPrice: 2900000, rating: 4, image: 'https://via.placeholder.com/300x200?text=محصول+1' },
    { id: 2, name: 'ست افزار دقیق', price: 1200000, oldPrice: 1500000, rating: 5, image: 'https://via.placeholder.com/300x200?text=محصول+2' },
    { id: 3, name: 'دریل تático', price: 890000, oldPrice: 1100000, rating: 4, image: 'https://via.placeholder.com/300x200?text=محصول+3' },
    { id: 4, name: 'ست مهندسی دقت', price: 3200000, oldPrice: 3800000, rating: 5, image: 'https://via.placeholder.com/300x200?text=محصول+4' },
    { id: 5, name: 'lox gauge دیجیتال', price: 450000, oldPrice: 550000, rating: 3, image: 'https://via.placeholder.com/300x200?text=محصول+5' },
    { id: 6, name: 'multi-meter پیشرفته', price: 720000, oldPrice: 880000, rating: 4, image: 'https://via.placeholder.com/300x200?text=محصول+6' }
  ];

  categories = [
    { id: 1, name: 'ابزار الکتریکی', icon: '⚡' },
    { id: 2, name: 'ابزار دستی', icon: '🔧' },
    { id: 3, name: 'ابزار دقیق', icon: '🔬' },
    { id: 4, name: 'ابزارпарکشی', icon: '🚜' }
  ];
}