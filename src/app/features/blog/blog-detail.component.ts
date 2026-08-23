import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { fadeIn } from '../../shared/animations';
import { BlogPost, BlogService } from '../../core/services/api/blog.service';

/** صفحه جزئیات پست وبلاگ */
@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.scss'],
  animations: [fadeIn]
})
export class BlogDetailComponent implements OnInit {
  post: BlogPost | null = null;
  loading = true;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly blogService: BlogService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'شناسه پست معتبر نیست.';
      this.loading = false;
      return;
    }

    this.blogService.getPostById(id).subscribe({
      next: (result) => {
        this.post = result.data ?? null;
        this.loading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.loading = false;
      }
    });
  }
}
