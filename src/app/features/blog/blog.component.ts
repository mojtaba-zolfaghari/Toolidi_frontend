import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { slideUp } from '../../shared/animations';
import { BlogPost, BlogService } from '../../core/services/api/blog.service';

/** صفحه فهرست وبلاگ */
@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  animations: [slideUp]
})
export class BlogComponent implements OnInit {
  posts: BlogPost[] = [];
  page = 1;
  pageSize = 9;
  totalPages = 1;
  totalCount = 0;
  loading = true;
  errorMessage = '';

  constructor(
    private readonly blogService: BlogService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  /** بارگذاری پست‌های منتشرشده */
  loadPosts(): void {
    this.loading = true;
    this.blogService.getPosts({ pageNumber: this.page, pageSize: this.pageSize }).subscribe({
      next: (result) => {
        const paged = result.data;
        this.posts = paged?.items ?? [];
        this.totalCount = paged?.totalCount ?? 0;
        this.totalPages = Math.max(1, Math.ceil((paged?.totalCount ?? 0) / this.pageSize));
        this.loading = false;
      },
      error: (err: Error) => {
        this.posts = [];
        this.errorMessage = err.message;
        this.loading = false;
      }
    });
  }

  /** رفتن به جزئیات پست */
  openPost(id: string): void {
    this.router.navigate(['/blog', id]);
  }

  /** تغییر صفحه */
  onPageChange(page: number): void {
    this.page = page;
    this.loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
