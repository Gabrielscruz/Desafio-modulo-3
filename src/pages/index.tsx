import { GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

function formatPost(Posts): Post[] {
  const posts = Posts.map(post => {
    const first_publication_date = format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    );
    return {
      uid: post.uid,
      first_publication_date,
      data: {
        title: RichText.asText(post.data.title),
        subtitle: RichText.asText(post.data.subtitle),
        author: RichText.asText(post.data.author),
      },
    };
  });
  return posts;
}
export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [next_page, setNext_page] = useState<string>(postsPagination.next_page);

  async function handleLoadNextPage(page: string): Promise<void> {
    const response = await fetch(page);
    const data = await response.json();
    const post = await formatPost(data.results);
    setPosts([...posts, ...post]);
    setNext_page(data.next_page || null);
  }

  return (
    <div className={commonStyles.content}>
      <main className={commonStyles.main}>
        <Header />
        {posts.map(item => (
          <Link href={`/post/${item.uid}`} key={item.uid}>
            <div className={styles.post} key={item.uid}>
              <a>
                <h1>{item.data.title}</h1>
                <strong>{item.data.subtitle}.</strong>
                <span>
                  <time>
                    <FiCalendar />
                    {item.first_publication_date}
                  </time>
                  <p>
                    <FiUser />
                    {item.data.author}
                  </p>
                </span>
              </a>
            </div>
          </Link>
        ))}
        <>
          {next_page && (
            // eslint-disable-next-line react/button-has-type
            <button
              onClick={() => handleLoadNextPage(next_page)}
              className={styles.mais}
            >
              Carregar mais posts
            </button>
          )}
        </>
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = await getPrismicClient();
  const response = await prismic.getByType('blogpost', {
    pageSize: 5,
  });
  const posts = await formatPost(response.results);

  return {
    props: {
      postsPagination: {
        next_page: response.next_page,
        results: posts,
      },
    },
  };
};
