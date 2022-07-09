/* eslint-disable react/jsx-no-comment-textnodes */
import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { MdOutlineWatchLater } from 'react-icons/md';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    last_publication_date: string | null;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }
  function timeRead(): number {
    const AllText = post.data.content.map(item => {
      return (
        String(item.body).replace(/(<([^>]+)>)/gi, '') +
        item.heading.replace(/(<([^>]+)>)/gi, '')
      );
    });
    const TextArray = AllText[0].split(' ');
    const countWords = TextArray.join('').length;
    return Math.ceil(countWords / 200);
  }
  const timeToRead = timeRead();
  return (
    <div className={commonStyles.content}>
      <div className={styles.header}>
        <Header />
      </div>
      <div
        className={styles.banner}
        style={{
          backgroundImage: `url(${post.data.banner.url})`,
        }}
      />
      <main className={commonStyles.main}>
        <div className={styles.container}>
          <div className={styles.title}>
            <h1>{post.data.title}</h1>
            <span>
              <time>
                <FiCalendar />
                {post.first_publication_date}
              </time>
              <p>
                <FiUser />
                {post.data.author}
              </p>
              <time>
                <MdOutlineWatchLater />
                {timeToRead} min
              </time>
            </span>
          </div>
          <>
            {post.data.content.map(item => {
              return (
                <div key={item.heading}>
                  <h3>{item.heading}</h3>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: item.body,
                    }}
                  />
                </div>
              );
            })}
          </>
        </div>
      </main>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  // query
  const posts = await prismic.getByType('blogpost', {
    pageSize: 1,
  });

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('blogpost', String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: RichText.asText(response.data.title),
      author: RichText.asText(response.data.author),
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: RichText.asText(content.heading),
          body: [RichText.asHtml(content.body)],
        };
      }),
    },
  };

  return {
    props: { post },
    redirect: 60 * 30,
  };
};
